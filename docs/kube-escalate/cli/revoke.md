---
sidebar_position: 5
title: revoke
---

# kubectl escalate revoke

```
kubectl escalate revoke [flags]
```

Delete active kube-escalate bindings before their TTL elapses.
When a binding is manually revoked the operator emits an `EscalationRevoked`
Kubernetes Event (via the finalizer). `kube_escalate_active_escalations` is
computed from live cluster state at scrape time, so it reflects the
revocation automatically — there's no counter to decrement.

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

1. Detects `DeletionTimestamp` is set and the effective TTL has **not** elapsed.
2. Emits an `EscalationRevoked` event (type `Normal`).
3. Calls `Metrics.RecordRevocation` — increments `revoked_total` and records the duration histogram.
4. Removes the finalizer; the API server garbage-collects the object.
