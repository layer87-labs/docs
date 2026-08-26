---
sidebar_position: 3
title: Hardening
---

# Hardening

The RBAC grant in [Installation](./installation#rbac-prerequisites) is
necessary but **not sufficient** on its own. This page explains the gap and
how to close it with a `ValidatingAdmissionPolicy`.

## The gap: `create` cannot be scoped by `resourceNames`

Kubernetes' `resourceNames` field restricts a verb to specific, already-named
objects. It works for `bind` on ClusterRoles (`resourceNames: ["cluster-admin"]`)
because the ClusterRole already exists. It **cannot** work for `create` on
`clusterrolebindings` — the binding being created doesn't have a name to
match against until after the request is authorized.

Practically, that means the RBAC grant from Installation lets a member of the
escalation group create *any* `ClusterRoleBinding`, not only ones that go
through `kubectl escalate`. Nothing in plain RBAC stops them from creating one
that:

- **carries no `kube-escalate/managed=true` label** — the operator never
  watches it, so it never expires. A JIT grant becomes a permanent one.
- **carries no (or a bogus) `kube-escalate/expires-at` annotation** — same
  effect.
- **names a different subject** — the requester grants the target role to
  someone else (or to a ServiceAccount), not themselves.

The RBAC grant establishes *who may escalate to what*. It does not establish
*that every binding they create is actually a kube-escalate-managed,
self-targeted, time-limited one*. That second guarantee needs a
`ValidatingAdmissionPolicy` (Kubernetes 1.30+), because CEL admission
validation can inspect the object being created — which plain RBAC cannot.

## Reference policy

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: kube-escalate-requester-constraints
spec:
  failurePolicy: Fail

  matchConstraints:
    resourceRules:
      - apiGroups: ["rbac.authorization.k8s.io"]
        apiVersions: ["v1"]
        operations: ["CREATE"]
        resources: ["clusterrolebindings", "rolebindings"]

  matchConditions:
    - name: only-escalation-group
      # Only members of the escalation group are constrained. Everyone
      # else — controllers, GitOps tooling, other admins — creates ordinary
      # bindings and passes through untouched.
      expression: "'<your-oidc-group>' in request.userInfo.groups"
    - name: exempt-cluster-admins
      # Break-glass: a real cluster-admin (admin kubeconfig, system:masters)
      # must never be locked out of creating ordinary RBAC, even if their
      # identity also carries the escalation group.
      expression: "!('system:masters' in request.userInfo.groups)"

  validations:
    - expression: >-
        has(object.metadata.labels) &&
        'kube-escalate/managed' in object.metadata.labels &&
        object.metadata.labels['kube-escalate/managed'] == 'true'
      message: >-
        kube-escalate: this group may only create bindings labelled
        kube-escalate/managed=true - use 'kubectl escalate'.
      reason: Forbidden

    - expression: >-
        has(object.metadata.annotations) &&
        'kube-escalate/expires-at' in object.metadata.annotations &&
        timestamp(object.metadata.annotations['kube-escalate/expires-at']) > timestamp('2000-01-01T00:00:00Z')
      message: >-
        kube-escalate: binding must carry a parseable RFC3339
        kube-escalate/expires-at annotation - use 'kubectl escalate'.
      reason: Forbidden

    - expression: >-
        has(object.subjects) && size(object.subjects) == 1 &&
        object.subjects[0].kind == 'User' &&
        object.subjects[0].name == request.userInfo.username
      message: >-
        kube-escalate: an escalation may only name the requesting user as
        its single subject.
      reason: Forbidden
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: kube-escalate-requester-constraints-binding
spec:
  policyName: kube-escalate-requester-constraints
  validationActions: ["Deny"]
```

Replace `<your-oidc-group>` with the group bound in the RBAC grant from
Installation. This must match the same group so the policy constrains exactly
the identities the RBAC grant empowers — everyone else is unaffected
(`matchConditions` short-circuits the policy for them).

A note on the `object.metadata.labels` check: it deliberately lives in
`validations` (evaluated against the incoming object), not in
`matchConstraints.objectSelector`. An `objectSelector` only ever matches
objects that *already* carry the label — it could never catch the case this
policy exists to catch, an object that is missing it.

## Also constrain `DELETE`

The policy above covers `CREATE` only. That leaves a second hole: the RBAC
grant includes `delete` on bindings, because `kubectl escalate revoke` needs
it — and `delete` cannot be scoped by `resourceNames` either, since escalation
object names are generated at request time and are not known in advance.

Unconstrained, that lets a member of the escalation group delete **any**
`ClusterRoleBinding` in the cluster: `cluster-admin`, a controller's binding,
anything. That is privilege *destruction* rather than escalation, but it is
trivially cluster-breaking and worth closing.

This needs a **second, separate policy**. On a `DELETE` request the incoming
`object` is null and the object being removed is in `oldObject`, so folding
both operations into one policy would evaluate the `CREATE` expressions
against null and — under `failurePolicy: Fail` — reject every delete.

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: kube-escalate-requester-delete-constraints
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
      - apiGroups:   ["rbac.authorization.k8s.io"]
        apiVersions: ["v1"]
        operations:  ["DELETE"]
        resources:   ["clusterrolebindings", "rolebindings"]
  matchConditions:
    - name: only-escalation-group
      expression: "'<your-oidc-group>' in request.userInfo.groups"
    - name: exempt-cluster-admins
      expression: "!('system:masters' in request.userInfo.groups)"
  validations:
    # May only delete kube-escalate-managed bindings, never ordinary RBAC.
    - expression: >-
        has(oldObject.metadata.labels)
          && 'kube-escalate/managed' in oldObject.metadata.labels
          && oldObject.metadata.labels['kube-escalate/managed'] == 'true'
      message: "kube-escalate: you may only delete kube-escalate-managed bindings."
      reason: Forbidden
    # May only revoke your OWN escalation, not somebody else's.
    - expression: >-
        has(oldObject.subjects)
          && size(oldObject.subjects) == 1
          && oldObject.subjects[0].kind == 'User'
          && oldObject.subjects[0].name == request.userInfo.username
      message: "kube-escalate: you may only revoke your own escalation."
      reason: Forbidden
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: kube-escalate-requester-delete-constraints-binding
spec:
  policyName: kube-escalate-requester-delete-constraints
  validationActions: ["Deny"]
```

## Roll-out: start in `Warn`/`Audit`, not `Deny`

The policy above uses `failurePolicy: Fail` and, in the binding, escalates
straight to `Deny`. `Fail` means that if the API server cannot evaluate the
policy (a transient CEL evaluation error, an apiserver hiccup), the matched
request is **rejected** — appropriate for a security control, since `Ignore`
would silently let unvalidated bindings through during any evaluation
failure. But `Fail` combined with `Deny` on day one, before you've confirmed
the CEL expressions behave exactly as intended against your actual
`kubectl escalate` traffic, risks locking out the escalation group entirely
on a policy bug.

Roll out in two steps:

1. **Warn + Audit first.** Deploy with:

   ```yaml
   spec:
     validationActions: ["Warn", "Audit"]
   ```

   Requests that would be denied are allowed through, but the caller gets a
   warning and the API server audit log records the violation. Watch this for
   real `kubectl escalate` traffic (and any other legitimate use of `bind`
   by the same group, if any) for a representative period.

2. **Switch to `Deny`** once you've confirmed no false positives, by changing
   `validationActions` to `["Deny"]` (optionally keeping `"Audit"` alongside
   it for a paper trail of rejections).

`failurePolicy: Fail` is appropriate to keep from the start — it is the
`validationActions` transition, not the failure policy, that should be
staged.

## Requirements and scope

- Kubernetes **1.30+** (`ValidatingAdmissionPolicy` graduated to GA in 1.30).
  On older clusters, this specific hardening isn't available — consider a
  `ValidatingWebhookConfiguration`
  achieving the same three checks as a substitute (it re-introduces an
  availability dependency the operator itself deliberately avoids).
- The policy binding above targets a single group. If you grant escalation
  RBAC to multiple groups with different allowed target roles, either extend
  `matchConditions` to cover all of them or deploy one policy/binding pair per
  group.
- These policies constrain **creation and deletion**. They do not — and cannot
  — prevent a user who already holds a broader standing grant (e.g.
  `system:masters`, or direct `create`+`bind: *` elsewhere) from bypassing
  them; the security boundary is only as tight as the RBAC you grant beneath
  it.

## What this does not protect against

:::danger An escalation to `cluster-admin` is not containment
Everything on this page constrains how a grant is *obtained*. None of it
constrains what the holder does once they have it.

When the target role is `cluster-admin`, the time bound is only enforced
against someone who **cooperates with it**. During the escalation window that
user is a full cluster admin, and can therefore:

- delete the `ValidatingAdmissionPolicy` objects on this page,
- `update` their own binding's `kube-escalate/expires-at` annotation, or strip
  the cleanup finalizer,
- scale down or uninstall the operator,
- create an ordinary, permanent `ClusterRoleBinding` for anyone.

None of that is preventable from inside the cluster once `cluster-admin` has
been granted — by kube-escalate or by any other JIT tool.
:::

The threat model kube-escalate addresses is **standing privilege and
accident**: credentials that are cluster-admin around the clock and get
stolen, reused in a script, or used carelessly; and the inability to answer
*"who held admin last Tuesday, and why?"*. It does **not** address a malicious
insider who is already authorised to escalate.

What follows from that:

- **Who may escalate is the real security decision**, not the TTL. Adding
  someone to the escalation group is equivalent to handing them a permanent
  admin kubeconfig, plus an audit trail.
- **Ship the logs off-cluster.** Kubernetes Events are short-lived and an
  escalated user can delete them. Exported logs cannot be retracted.
- **Alert on tamper signals**: mutation of the operator Deployment, of the
  admission policies above, or of a managed binding's annotations.
- **Prefer narrower targets than `cluster-admin`** wherever the task allows.
  A role that cannot edit RBAC or admission configuration *is* genuinely
  bounded by the TTL. `cluster-admin` is not.
