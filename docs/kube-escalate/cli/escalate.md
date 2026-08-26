---
sidebar_position: 2
title: escalate
---

# kubectl escalate

```
kubectl escalate [flags]
```

Create a time-limited privilege escalation. Your identity is resolved via the
Kubernetes `SelfSubjectReview` API — it cannot be supplied or forged via CLI
arguments. This works the same regardless of how you authenticated to the
cluster (OIDC, X.509 client certs, or any other authenticator the API server
trusts) — see [Compatibility](../installation#compatibility).

Cluster-wide (`--namespace` omitted) creates a `ClusterRoleBinding`.
Namespace-scoped (`--namespace <ns>`) creates a `RoleBinding`.

## Flags

| Flag | Required | Description |
| --- | --- | --- |
| `--to string` | ✓ | ClusterRole (cluster-wide) or Role (namespace-scoped) to bind |
| `--duration duration` | ✓ | Escalation TTL, e.g. `1h`, `30m`, `90m` |
| `--reason string` | ✓ | Human-readable justification (stored as annotation) |
| `-n, --namespace string` | — | Scope to a `RoleBinding`; omit for cluster-wide `ClusterRoleBinding` |
| `--kubeconfig string` | — | Path to kubeconfig |

## Examples

```bash
# Cluster-wide escalation for 1 hour
kubectl escalate \
  --to cluster-admin \
  --duration 1h \
  --reason "Deploying CNPG update"

# Namespace-scoped escalation for 30 minutes
kubectl escalate \
  --to editor \
  --namespace tenant-acme \
  --duration 30m \
  --reason "Fixing broken deployment"
```

## Annotations written

The plugin writes the following annotations to the created binding:

| Annotation | Value |
| --- | --- |
| `kube-escalate/managed` | `"true"` (label) |
| `kube-escalate/expires-at` | RFC3339 expiry timestamp |
| `kube-escalate/requester` | Username from `SelfSubjectReview` |
| `kube-escalate/reason` | Value of `--reason` |
| `kube-escalate/original-groups` | Groups from `SelfSubjectReview` |

:::info Requesting more than `maxDuration` doesn't fail
There is no client-side validation against the operator's ceiling. If
`--duration` exceeds the operator's `maxDuration`, the binding is still
created — the operator clamps the effective expiry on its first reconcile
and emits an `EscalationClamped` event. See
[Known limitations](../usage#known-limitations).
:::
