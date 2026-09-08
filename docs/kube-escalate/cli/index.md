---
sidebar_position: 1
title: kubectl-escalate
---

# kubectl-escalate

```
kubectl-escalate [flags]
kubectl-escalate [command]
```

## Global flags

| Flag | Default | Description |
| --- | --- | --- |
| `--kubeconfig string` | `$KUBECONFIG` → `~/.kube/config` | Path to kubeconfig |
| `--version` | | Print version and exit |
| `--help` | | Print help |

## Subcommands

| Command | Description |
| --- | --- |
| [`kubectl escalate targets`](targets) | Show which roles you may escalate to |
| [`kubectl escalate`](escalate) | Create a time-limited escalation (default action) |
| [`kubectl escalate status`](status) | List active escalations |
| [`kubectl escalate revoke`](revoke) | Delete active escalations before TTL elapses |
