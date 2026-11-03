---
sidebar_position: 1
title: CLI reference
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl

```text
relctl make your release tagging easy
Comatible with CI pipelines like Jenkins and GitHub
Find more information and examples at: https://github.com/layer87-labs/relctl
```

| Command | Description |
| --- | --- |
| [`relctl connect`](./connect.md) | Store server and repository of a GitHub or GitHub Enterprise repository in .relctl-connection.yaml |
| [`relctl parse`](./parse.md) | inspect and parse JSON and YAML files to retrieve values, similar to jq with additional features |
| [`relctl pr`](./pr.md) | Manage GitHub pull requests |
| [`relctl release`](./release.md) | Manage GitHub releases with ease |
| [`relctl transform`](./transform.md) | transform given input to json |

## Flags of every command

```text
      --config string   path to .relctl.yaml config file (default: .relctl.yaml in working directory)
  -v, --verbose         verbose output
```
