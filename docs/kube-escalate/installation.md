---
sidebar_position: 2
title: Installation
---

# Installation

## Prerequisites

- Kubernetes 1.26+ (1.30+ if you plan to deploy the `ValidatingAdmissionPolicy`
  from [Hardening](./hardening) — recommended for any real deployment)
- `kubectl` configured with cluster access
- Helm 3.x (operator install only)

## Compatibility

Identity is resolved entirely through the Kubernetes `SelfSubjectReview` API,
which is populated by the API server from whatever authenticator validated
the request. kube-escalate does not talk to your identity provider directly,
so it works unchanged with **any** authenticator the API server trusts:
Keycloak, Microsoft Entra ID, Okta, Dex, a generic OIDC issuer, or plain X.509
client certificates.

---

## Operator

The operator runs in the cluster and enforces TTLs on escalated bindings.

```bash
helm install kube-escalate oci://ghcr.io/layer87-labs/charts/kube-escalate \
  --namespace kube-escalate \
  --create-namespace
```

Verify the operator is running:

```bash
kubectl -n kube-escalate get pods -l app.kubernetes.io/name=kube-escalate
```

### Key values

| Value | Default | Description |
| --- | --- | --- |
| `image.tag` | Chart `appVersion` | Override the operator image tag |
| `replicaCount` | `1` | Set to `2` with `leaderElection.enabled=true` for HA |
| `leaderElection.enabled` | `true` | Required when `replicaCount > 1` |
| `maxDuration` | `24h` | Operator-enforced ceiling on any requested TTL — requests beyond it are clamped, never rejected |
| `metrics.serviceMonitor.enabled` | `false` | Create a Prometheus Operator `ServiceMonitor` |
| `networkPolicy.enabled` | `false` | Restrict ingress/egress to operator pods |
| `podDisruptionBudget.enabled` | `false` | Enable when `replicaCount > 1` |

Full reference: [`deploy/helm/values.yaml`](https://github.com/layer87-labs/kube-escalate/blob/main/deploy/helm/values.yaml)

### Cilium note

If your cluster runs **Cilium with `kube-proxy-replacement: true`** (full eBPF kube-proxy
replacement), the standard Kubernetes `NetworkPolicy` cannot express "allow traffic to
the API server" in a way that survives Cilium's eBPF DNAT. Use a
`CiliumNetworkPolicy` with `toEntities: [kube-apiserver]` instead, or leave
`networkPolicy.enabled: false` until that is in place.

---

## Plugin (`kubectl-escalate`)

The plugin is **client-side**: it runs on a workstation, not in the cluster.
Deploying the operator installs nothing for your users — each person installs
this themselves.

Releases ship **plain, versioned binaries**. There is no archive to unpack.

Anything on your `PATH` named `kubectl-escalate` is picked up by `kubectl` as
`kubectl escalate`.

### Linux — amd64

```bash
VERSION=0.5.0
mkdir -p ~/.local/bin

gh release download "$VERSION" --repo layer87-labs/kube-escalate \
  --pattern "kubectl-escalate_${VERSION}_linux-amd64" \
  --pattern 'sha256sum.txt'

grep "kubectl-escalate_${VERSION}_linux-amd64$" sha256sum.txt | sha256sum -c -

install -m 0755 "kubectl-escalate_${VERSION}_linux-amd64" ~/.local/bin/kubectl-escalate
kubectl escalate --version
```

Without the `gh` CLI, replace the download step:

```bash
BASE=https://github.com/layer87-labs/kube-escalate/releases/download/$VERSION
curl -fLO "$BASE/kubectl-escalate_${VERSION}_linux-amd64"
curl -fLO "$BASE/sha256sum.txt"
```

`curl -f` matters. Without it a 404 response body is written to the output
file and you "install" an HTML error page.

### Other platforms

Only the asset suffix changes.

| Platform | Suffix |
|---|---|
| Linux arm64 | `linux-arm64` |
| macOS Apple Silicon | `darwin-arm64` |
| macOS Intel | `darwin-amd64` |
| Windows amd64 | `windows-amd64.exe` |

macOS quarantines downloaded binaries:

```bash
xattr -d com.apple.quarantine ~/.local/bin/kubectl-escalate 2>/dev/null || true
```

On Windows, place `kubectl-escalate.exe` anywhere on `PATH`.

:::danger[Always verify the checksum]
A download that stops early leaves a **valid ELF binary** that segfaults with
exit code 139 on every invocation and prints **nothing at all**. It is
indistinguishable from a broken release build, and it will cost you an hour
before you think to compare file sizes.

`sha256sum -c` turns that into a one-line `FAILED`.
:::

### Verifying the signature (optional)

Binaries are signed with [cosign](https://github.com/sigstore/cosign),
keyless via GitHub OIDC.

:::warning[`gh attestation verify` does not work here]
The `.bundle` files are **cosign** bundles produced by `cosign sign-blob`, not
GitHub provenance attestations. `gh attestation verify` fails against them
with a 404 from the attestation API. Use `cosign` instead.
:::

```bash
gh release download "$VERSION" --repo layer87-labs/kube-escalate \
  --pattern "kubectl-escalate_${VERSION}_linux-amd64.bundle"

cosign verify-blob \
  --bundle "kubectl-escalate_${VERSION}_linux-amd64.bundle" \
  --certificate-identity-regexp '^https://github\.com/layer87-labs/kube-escalate/\.github/workflows/release\.yaml@refs/heads/main$' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "kubectl-escalate_${VERSION}_linux-amd64"
```

Expected output: `Verified OK`.

Each binary also ships an SPDX SBOM (`*.sbom.spdx.json`).

:::info[Krew]
Krew publication is planned after the first stable release.
:::

---

## RBAC prerequisites

**Installing the operator does nothing by itself.** The operator only
enforces TTLs on bindings that already exist — it never grants anyone
permission to create one. Until you grant RBAC to a group or user, nobody can
invoke `kubectl escalate` at all (`kubectl auth can-i create
clusterrolebindings` will say no for everyone except existing cluster-admins).

kube-escalate itself keeps no allow-list of who may escalate to what. **The
entire security boundary is native Kubernetes RBAC** — specifically:

- `create` on `clusterrolebindings` / `rolebindings` lets a user create a
  binding at all.
- The `bind` verb, scoped with `resourceNames` to specific ClusterRoles or
  Roles, lets a user reference a role whose permissions they don't already
  hold. Without `bind` (or without already holding the target role's own
  permissions), Kubernetes' own RBAC privilege-escalation check rejects the
  `Create` before kube-escalate's operator is ever involved.

Nothing here is enforced or interpreted by kube-escalate — it is exactly the
same `bind`/`escalate` mechanism the Kubernetes API server applies to any RBAC
object, from any client.

### Example: grant a group the ability to escalate to `cluster-admin`

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kube-escalate-requester
rules:
  # Resolve identity via SelfSubjectReview (tamper-proof identity, not
  # provider-specific — see Compatibility above). Usually already granted to
  # system:authenticated via the built-in system:basic-user role; restated
  # here so this grant is self-contained.
  - apiGroups: ["authentication.k8s.io"]
    resources: ["selfsubjectreviews"]
    verbs: ["create"]

  # Answer "kubectl escalate targets". Same situation as above: already held
  # by every authenticated user, restated for self-containment.
  - apiGroups: ["authorization.k8s.io"]
    resources: ["selfsubjectrulesreviews"]
    verbs: ["create"]

  # Optional: lets "targets" display the enforced max duration. Without it
  # the column is simply omitted.
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["kube-escalate-config"]
    verbs: ["get"]

  # Create escalation bindings, and list/revoke one's own via
  # `kubectl escalate status` / `revoke`.
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterrolebindings", "rolebindings"]
    verbs: ["create", "get", "list", "watch", "delete"]

  # The escalation privilege itself: permits referencing this specific
  # ClusterRole in a binding without already holding its permissions.
  # Add more resourceNames to allow escalating to other roles too.
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterroles"]
    resourceNames: ["cluster-admin"]
    verbs: ["bind"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kube-escalate-requester
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kube-escalate-requester
subjects:
  - kind: Group
    name: <your-oidc-group>
    apiGroup: rbac.authorization.k8s.io
```

### Verify the group name — the mistake everyone makes first

`<your-oidc-group>` must match the group **as the API server sees it**,
including any prefix your OIDC configuration adds. Getting this wrong produces
**no error at install time**. Everything looks healthy and nobody can escalate,
which you discover during an incident.

```bash
kubectl auth whoami -o jsonpath='{.status.userInfo.groups}'
```

Compare that output against the `name:` in the `ClusterRoleBinding` above, then
confirm from a user's side:

```bash
kubectl escalate targets
```

If that prints *"You may not escalate to any role"*, the grant is not reaching
you — the group name is the first thing to check.

### Target roles must already exist

kube-escalate never creates the roles you escalate **to**. `cluster-admin` is
built in; anything custom is yours to create beforehand.

Optionally annotate one so `kubectl escalate targets` can explain it:

```bash
kubectl annotate clusterrole cluster-admin \
  kube-escalate/description="full cluster access — use sparingly"
```

For namespace-scoped escalation (`kubectl escalate --namespace`), grant `bind`
on specific `Role` names instead:

```yaml
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["roles"]
    resourceNames: ["edit"]
    verbs: ["bind"]
```

:::danger[This grant alone is not enough]
`create` on `clusterrolebindings` cannot be scoped by `resourceNames` — the
object doesn't exist yet at authorization time. Without an additional guard,
a member of this group could create an **unmanaged** binding (no
`kube-escalate/managed` label, no expiry — a permanent grant) or bind a
different subject entirely, bypassing kube-escalate altogether while still
only using RBAC you granted for JIT access.

Read [Hardening](./hardening) and deploy the `ValidatingAdmissionPolicy`
there alongside this grant. Do not treat the RBAC grant above as sufficient
on its own for any cluster used by real people.
:::

### Operator

Installed automatically by the Helm chart.
See [`deploy/helm/templates/clusterrole.yaml`](https://github.com/layer87-labs/kube-escalate/blob/main/deploy/helm/templates/clusterrole.yaml)
— it grants only `get/list/watch/update/patch/delete` on bindings; the
operator can never *create* one.
