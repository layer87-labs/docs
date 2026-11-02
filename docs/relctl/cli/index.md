---
sidebar_position: 1
title: relctl
---

# relctl

Release automation CLI — connects your CI/CD pipeline to GitHub.

```bash
relctl [flags]
```

## Flags

```
  -h, --help      help for relctl
  -v, --verbose   verbose output
```

## Subcommands

| Command | Description |
| --- | --- |
| `relctl connect` | Store server and repository of a GitHub or GitHub Enterprise repository in `.relctl-connection.yaml` (no token) |
| `relctl parse` | Inspect and parse JSON and YAML files |
| `relctl pr` | Manage GitHub pull requests |
| `relctl release` | Manage GitHub releases |
| `relctl transform` | Transform input to JSON |
