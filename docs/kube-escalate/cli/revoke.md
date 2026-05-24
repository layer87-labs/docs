---
sidebar_position: 4
title: revoke
---

# kubectl escalate revoke

```
kubectl escalate revoke [flags]
```

Delete active kube-escalate bindings before their TTL elapses.
When a binding is manually revoked the operator emits a `Normal/EscalationRevoked`
Kubernetes Event (via the finalizer) and decrements the active escalations gauge.

## Flags

| Flag | Default | Description |
| --- | --- | --- |
| `--all` | `false` | Revoke escalations for all users |
| `--kubeconfig string` | `$KUBECONFIG` | Path to kubeconfig |

## Examples

```bash
# Revoke your own escalations
kubectl escalate revoke

# Revoke all users' escalations (requires delete on clusterrolebindings)
kubectl escalate revoke --all
```

## How revocation works

Revoking calls `Delete` on the binding. Because the operator adds the
`kube-escalate.layer87.de/cleanup` finalizer on first reconcile, the API
server sets `DeletionTimestamp` instead of immediately removing the object.
On the next reconcile the operator:

1. Detects `DeletionTimestamp` is set and TTL has **not** elapsed.
2. Emits `Normal/EscalationRevoked` event.
3. Calls `Metrics.RecordRevocation` — decrements `active_escalations`, increments `revoked_total`.
4. Removes the finalizer; the API server garbage-collects the object.
