---
sidebar_position: 2
title: targets
---

# kubectl escalate targets

```
kubectl escalate targets [flags]
kubectl escalate list [flags]      # alias
```

Show which roles you are permitted to escalate to.

```
TARGET          SCOPE     MAX DURATION   DESCRIPTION
cluster-admin   cluster   8h0m0s         full cluster access — use sparingly
```

## Flags

| Flag | Default | Description |
| --- | --- | --- |
| `--namespace`, `-n string` | — | Also show roles bindable within this namespace |
| `--operator-namespace string` | `kube-escalate` | Namespace the operator is installed in, used to read its published settings |
| `--kubeconfig string` | `$KUBECONFIG` | Path to kubeconfig |

## How the list is produced

The command creates a `SelfSubjectRulesReview` and reads back the rules
granting the `bind` verb on `clusterroles` or `roles`, using their
`resourceNames` as the permitted targets.

That is the **API server's own evaluation** of your permissions, which matters
for three reasons:

- It stays correct across multiple roles, aggregated roles, and regardless of
  which group carries the grant — none of which a client-side reconstruction
  handles reliably.
- It needs **no permission beyond what any authenticated user already has for
  itself**, exactly like the `SelfSubjectReview` used to resolve your identity.
- It works on clusters whose RBAC is assembled completely differently from
  yours.

## "You may not escalate to any role"

This is an RBAC question, not a kube-escalate one — someone must grant your
group the `bind` verb on the roles you should be able to request.

The most common cause by far is a **group-name mismatch**: the grant names a
group your accounts are not actually in. It produces no error at install time
and surfaces only when someone needs to escalate.

```bash
kubectl auth whoami -o jsonpath='{.status.userInfo.groups}'
```

Compare that against the subject in the requester `ClusterRoleBinding`. See
[Installation](../installation#rbac-prerequisites).

## The `MAX DURATION` column

Shown only when the operator publishes its ceiling **and** you may read it.
The Helm chart renders a `kube-escalate-config` ConfigMap from its
`maxDuration` value; the plugin reads it from `--operator-namespace`.

The column is dropped — never guessed — when the ConfigMap is absent (an older
chart), unreadable (you lack `get` on it), or malformed.

:::warning A wrong number here would be worse than none
A request beyond the ceiling is **not rejected**. It is treated as expiring at
`CreationTimestamp + maxDuration`, with an `EscalationClamped` event. Someone
shown an inflated figure would plan around a deadline that will not hold —
which is precisely the situation this tool exists to prevent.
:::

Note that setting `--max-duration` through the chart's `extraArgs` instead of
the `maxDuration` value bypasses the ConfigMap and makes the displayed value
wrong.

## While you are already escalated

An active `cluster-admin` escalation contributes `verbs: ["*"]` on everything,
so the review legitimately reports an unrestricted bind grant. The command
still prints your scoped targets and adds a note, rather than collapsing to
"you may bind anything" — which would hide the answer at the moment you are
most likely to ask for it again.

## The `DESCRIPTION` column

Filled from a `kube-escalate/description` annotation on the target role, when
present and readable:

```bash
kubectl annotate clusterrole cluster-admin \
  kube-escalate/description="full cluster access — use sparingly"
```

Reading target roles is a separate permission that a requester does not need to
hold. When it is missing the column is simply empty; the command never fails
over it.
