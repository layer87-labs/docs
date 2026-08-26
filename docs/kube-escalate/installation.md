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

The plugin runs on your local machine and creates escalated bindings using your cluster credentials.

### Linux — amd64

```bash
curl -Lo kubectl-escalate.tar.gz \
  https://github.com/layer87-labs/kube-escalate/releases/latest/download/kubectl-escalate_linux_amd64.tar.gz
tar xf kubectl-escalate.tar.gz kubectl-escalate
chmod +x kubectl-escalate
sudo mv kubectl-escalate /usr/local/bin/
```

### macOS — Apple Silicon

```bash
curl -Lo kubectl-escalate.tar.gz \
  https://github.com/layer87-labs/kube-escalate/releases/latest/download/kubectl-escalate_darwin_arm64.tar.gz
tar xf kubectl-escalate.tar.gz kubectl-escalate
chmod +x kubectl-escalate
sudo mv kubectl-escalate /usr/local/bin/
```

### macOS — Intel

```bash
curl -Lo kubectl-escalate.tar.gz \
  https://github.com/layer87-labs/kube-escalate/releases/latest/download/kubectl-escalate_darwin_amd64.tar.gz
tar xf kubectl-escalate.tar.gz kubectl-escalate
chmod +x kubectl-escalate
sudo mv kubectl-escalate /usr/local/bin/
```

### Windows — amd64

Download `kubectl-escalate_windows_amd64.zip` from the
[latest release](https://github.com/layer87-labs/kube-escalate/releases/latest),
extract `kubectl-escalate.exe`, and place it on your `PATH`.

### Verify

```bash
kubectl escalate --version
```

:::info Krew
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

For namespace-scoped escalation (`kubectl escalate --namespace`), grant `bind`
on specific `Role` names instead:

```yaml
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["roles"]
    resourceNames: ["edit"]
    verbs: ["bind"]
```

:::danger This grant alone is not enough
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
