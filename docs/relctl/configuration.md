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
```

| Key | Default | Used by |
| --- | --- | --- |
| `version_scheme` | `semver` | `release create`, `release publish`, `pr info` — see [Version schemes](./version-schemes.md) |
| `changelog_file` | `CHANGELOG.md` | the `changelog` scheme, `release gate` |
| `production_branch` | `main` | `release forward` (the branch that is brought back into the development branch) |
| `development_branch` | the default branch of the repository | `release forward` |
| `default_branch` | — | former name of `production_branch`; still read and used if `production_branch` is not set |

## Priority

command-line flag > `.relctl.yaml` > built-in default

| Flag | Overrides |
| --- | --- |
| `--config <path>` | the location of the config file (default `.relctl.yaml`) |
| `--version-scheme <scheme>` | `version_scheme` |
| `--from <branch>`, `--to <branch>` (`release forward`) | `production_branch`, `development_branch` |

## Why the branches are configured and not guessed

The default branch of a repository is known to Git and GitHub, but which branch is the *production* and which the *development* branch is a decision of the team: with a `dev` branch, the default branch is `dev` and releases go to `main`. relctl therefore takes `production_branch` from the config (default `main`) and falls back to the repository's default branch only for the development branch. If both resolve to the same branch, `release forward` stops with a message instead of guessing.
