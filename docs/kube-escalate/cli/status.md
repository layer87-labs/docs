---
sidebar_position: 4
title: status
---

# kubectl escalate status

```
kubectl escalate status [flags]
```

List active kube-escalate `ClusterRoleBinding` and `RoleBinding` objects.
Without `--all`, only the current user's escalations are shown.

## Flags

| Flag | Default | Description |
| --- | --- | --- |
| `--all` | `false` | Show escalations for all users |
| `--kubeconfig string` | `$KUBECONFIG` | Path to kubeconfig |

## Output

```
REQUESTER               ROLE            SCOPE              EXPIRES AT            REMAINING
eike@layer87.de         cluster-admin   cluster            2026-05-24T16:00:00Z  55m0s
eike@layer87.de         editor          ns/tenant-acme     2026-05-24T15:30:00Z  25m0s
```

| Column | Description |
| --- | --- |
| `REQUESTER` | Username from `kube-escalate/requester` annotation |
| `ROLE` | Bound ClusterRole or Role name |
| `SCOPE` | `cluster` for `ClusterRoleBinding`; `ns/<namespace>` for `RoleBinding` |
| `EXPIRES AT` | RFC3339 expiry timestamp, as originally requested |
| `REMAINING` | Time until expiry, or `EXPIRED` if past the deadline |

:::info[EXPIRES AT may not be the real expiry]
`status` reads the `kube-escalate/expires-at` annotation exactly as written
by the plugin. If a request exceeded the operator's `maxDuration` ceiling,
the operator enforces a shorter, clamped expiry but never rewrites this
annotation (see [Architecture](../architecture#why-expires-at-is-never-rewritten)),
so `EXPIRES AT`/`REMAINING` can overstate how long the binding actually
lives. Watch for an `EscalationClamped` Kubernetes Event for the real
effective expiry.
:::

## Examples

```bash
# Your own escalations
kubectl escalate status

# All users (requires list on clusterrolebindings)
kubectl escalate status --all
```
