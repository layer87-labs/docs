---
sidebar_position: 2
title: connect
---

# relctl connect

Create an encrypted `.rc` file to persistently connect to GitHub or GitHub Enterprise.

Useful without a runner or in a Jenkins pipeline where environment variables are not automatically set by the CI system.

```bash
relctl connect [flags]
```

## Flags

```
  -h, --help      help for connect
  -v, --verbose   verbose output
```

## Subcommands

| Command | Description |
| --- | --- |
| `relctl connect github` | Connect to GitHub or GitHub Enterprise |
| `relctl connect check` | Verify current connection is working |
| `relctl connect remove` | Remove all persisted connection files and secrets |

### connect github

```bash
relctl connect github [flags]
```

```
  -h, --help              help for github
  -s, --server string     GitHub server URL (default: https://github.com)
  -t, --token string      GitHub personal access token
```

### connect check

```bash
relctl connect check [flags]
```

```
  -h, --help   help for check
```

### connect remove

```bash
relctl connect remove [flags]
```

```
  -h, --help   help for remove
```
