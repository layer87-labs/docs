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

# Tags and releases get this prefix: "v" gives v1.2.3 (the version itself stays 1.2.3).
tag_prefix: v

# Independently released parts of the repository.
components:
  whisper:
    paths: ["deploy/whisper/**", "deploy/Containerfile.whisper"]
    version_scheme: calver   # components use calver or changelog
```

| Key | Default | Used by |
| --- | --- | --- |
| `version_scheme` | `semver` | `release create`, `release publish`, `pr info` — see [Version schemes](./version-schemes.md) |
| `changelog_file` | `CHANGELOG.md` | the `changelog` scheme, `release gate` |
| `production_branch` | `main` | `release forward` (the branch that is brought back into the development branch) |
| `development_branch` | the default branch of the repository | `release forward` |
| `tag_prefix` | — | every command that reads or creates tags and releases; `RELCTL_TAG` is the version with the prefix |
| `components` | — | `release create`, `publish`, `gate`, `changed` and `pr info` with `--component` — see [Components](#components) |
| `default_branch` | — | former name of `production_branch`; still read and used if `production_branch` is not set |

## Components

A component is a part of one repository that is released independently, for example a container image next to a library. Each entry under `components` has:

| Key | Meaning |
| --- | --- |
| `paths` | glob patterns of the files that belong to the component |
| `version_scheme` | `calver` or `changelog` |
| `tag_prefix` | optional; the default is `<name>/` |

A component has its own tag prefix, its own latest release and its own CalVer counter. Select it with `--component NAME` on `release create`, `release publish`, `release gate` and `pr info`.

`relctl release changed --component NAME` tells whether a file of the component changed since its latest release (or since `--since <commit-or-tag>`), so a pipeline builds only what changed. It needs no access to GitHub and exports `RELCTL_CHANGED`, `RELCTL_CHANGED_FILES`, `RELCTL_COMPONENT` and `RELCTL_LATEST_VERSION`.

```bash
relctl release changed --component whisper
[ "$RELCTL_CHANGED" = "true" ] && relctl release create --component whisper
```

## Priority

command-line flag > `.relctl.yaml` > built-in default

| Flag | Overrides |
| --- | --- |
| `--config <path>` | the location of the config file (default `.relctl.yaml`) |
| `--version-scheme <scheme>` | `version_scheme` |
| `--component <name>` | selects an entry of `components` |
| `--from <branch>`, `--to <branch>` (`release forward`) | `production_branch`, `development_branch` |

## Why the branches are configured and not guessed

The default branch of a repository is known to Git and GitHub, but which branch is the *production* and which the *development* branch is a decision of the team: with a `dev` branch, the default branch is `dev` and releases go to `main`. relctl therefore takes `production_branch` from the config (default `main`) and falls back to the repository's default branch only for the development branch. If both resolve to the same branch, `release forward` stops with a message instead of guessing.
