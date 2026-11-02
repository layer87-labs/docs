---
sidebar_position: 2
title: connect
---

# relctl connect

Store server and repository of a GitHub or GitHub Enterprise repository in `.relctl-connection.yaml`.

The token is never stored: provide it as `GITHUB_TOKEN` on every call. The file holds no secret. Useful where relctl cannot detect the pipeline (GitLab CI with a GitHub repository, a local shell).

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
| `relctl connect remove` | Remove the connection file (and a legacy `.awesomerc.yaml`) |

### connect github

```bash
relctl connect github [flags]
```

```
  -h, --help                 help for github
  -r, --repository string    (required) repository, e.g. octo-org/octo-repo
  -s, --server string        GitHub server URL (default: https://github.com)
  -t, --token string         token used to verify the connection, not stored (default: $GITHUB_TOKEN)
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
