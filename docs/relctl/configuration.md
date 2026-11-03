---
sidebar_position: 3.5
title: Configuration (.relctl.yaml)
---

# Configuration: `.relctl.yaml`

relctl needs no configuration for the default flow. To change its behaviour for a repository, put a `.relctl.yaml` in the repository root. Every key is optional; a missing file or key means the default.

```yaml
# How the version is calculated.
# semver (default) | conventional-commits | calver | changelog
version_scheme: semver

# changelog scheme: the file with the "## X.Y.Z — YYYY-MM-DD" headings.
changelog_file: CHANGELOG.md

# Branches used by `relctl release forward`.
production_branch: main      # receives the releases
development_branch: dev      # work lands here first

# A prefix in front of every tag and release: "v" gives v1.2.3.
tag_prefix: v

# Independently released parts of the repository (see Release flows).
components:
  api:
    paths: ["services/api/**", "libs/common/**"]
  worker:
    tag_prefix: worker-v
    paths: ["services/worker/**", "libs/common/**"]
    version_scheme: changelog
    changelog_file: services/worker/CHANGELOG.md
```

| Key | Default | Used by |
| --- | --- | --- |
| `version_scheme` | `semver` | `release create`, `release publish`, `pr info` — see [Version schemes](./version-schemes.md) |
| `changelog_file` | `CHANGELOG.md` | the `changelog` scheme, `release gate` |
| `production_branch` | `main` | `release forward` (the branch that is brought back into the development branch) |
| `development_branch` | the default branch of the repository | `release forward` |
| `default_branch` | — | former name of `production_branch`; still read and used if `production_branch` is not set |
| `tag_prefix` | none | every command that reads or writes tags and releases — see [Tag prefix](#tag-prefix) |
| `components` | none | `--component` on `release create`, `release publish`, `release gate`, `pr info`, and `release changed` — see [Components](#components) |

## Tag prefix

`tag_prefix` is put in front of every tag and release of the repository: with `tag_prefix: v`, relctl creates the tag and release `v1.2.3` for the version `1.2.3`. The version itself stays plain: `RELCTL_VERSION` is `1.2.3`, the changelog heading is `## 1.2.3`, and the prefixed name is available as `RELCTL_TAG` (see [Variables](./release-flows.md#variables)).

The prefix is also used to find the latest release. A repository that tags `v1.2.3` needs `tag_prefix: v`; without it relctl does not recognise those tags and finds no latest release.

## Components

A *component* is a part of one repository that is released independently of the others, for example one container image each in a repository that holds two services. Every component has

- its own **tag prefix** (default `<name>/`, so `api/202611.3.1`),
- its own **latest release**, found by that prefix, and
- its own **CalVer counter**: the number `N` of `YYYYMM.D.N` counts only the releases of that component on that day.

| Key (under `components.<name>`) | Default | Meaning |
| --- | --- | --- |
| `paths` | none | Glob patterns of the files that belong to the component. `*` matches within a directory, `**` any number of directories, a plain directory name (`services/api`) everything below it. Required by `relctl release changed`. |
| `tag_prefix` | `<name>/` | Prefix of the component's tags and releases. The repository's `tag_prefix` does not apply to components. |
| `version_scheme` | the repository's scheme | `calver` or `changelog`. Other schemes are rejected: the version of a component must not depend on branch names or commits that belong to other components. |
| `changelog_file` | the repository's `changelog_file` | The changelog of the component, for the `changelog` scheme and `release gate`. |

Component names consist of lower case letters, digits, `.`, `_` and `-`. Select a component with `--component NAME`:

```bash
relctl release create --component api
```

relctl rejects

- an **unknown component**, and lists the known ones: `unknown component "foo": known components: api, worker`,
- **tag prefixes that collide**, between components or with the repository's `tag_prefix`: `component "a" and the repository use the same tag prefix "a/"`,
- a component whose scheme is not `calver` or `changelog`.

A complete pipeline is shown in [Release flows: Components](./release-flows.md#components).

## Priority

command-line flag > `.relctl.yaml` > built-in default

| Flag | Overrides |
| --- | --- |
| `--config <path>` | the location of the config file (default `.relctl.yaml`) |
| `--version-scheme <scheme>` | `version_scheme` (of the repository or, with `--component`, of the component) |
| `--from <branch>`, `--to <branch>` (`release forward`) | `production_branch`, `development_branch` |

## Why the branches are configured and not guessed

The default branch of a repository is known to Git and GitHub, but which branch is the *production* and which the *development* branch is a decision of the team: with a `dev` branch, the default branch is `dev` and releases go to `main`. relctl therefore takes `production_branch` from the config (default `main`) and falls back to the repository's default branch only for the development branch. If both resolve to the same branch, `release forward` stops with a message instead of guessing.
