---
sidebar_position: 4
title: pr
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl pr

Manage GitHub pull requests

```text
The pull request command is used to manage GitHub pull requests. It provides subcommands to get pull request info, allowing you to get all infos about a pull request in GitHub.
```

```text
relctl pr
```


## relctl pr info

Get pull request info and the version the pull request would release

```text
Prints the pull request and the version it would release, and exports them as
RELCTL_* variables. What decides the version depends on the version scheme:

  semver                the branch prefix and the comment commands of the pull request
  calver                the date of the release
  conventional-commits  the commit messages since the last release
  changelog             the topmost heading of the changelog (it may not be dated yet)
```

```text
relctl pr info [flags]
```

Flags:

```text
      --component string          preview the release of one component (calver and changelog schemes)
      --config string             path to .relctl.yaml config file
  -c, --merge-commit-sha string   send a given merge commit sha
  -n, --number int                overwrite the issue number
      --version-scheme string     versioning scheme: semver, calver, conventional-commits or changelog (overrides .relctl.yaml)
```

