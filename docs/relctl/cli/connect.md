---
sidebar_position: 2
title: connect
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl connect

Store server and repository of a GitHub or GitHub Enterprise repository in .relctl-connection.yaml

```text
Verifies the connection to GitHub or GitHub Enterprise and stores server and repository
in .relctl-connection.yaml. The token is never stored: provide it as GITHUB_TOKEN on every call.
The file holds no secret and may be committed.
GitLab is not supported as source control system (open an issue if you need it)
Useful where relctl cannot detect the pipeline (GitLab CI with a GitHub repository, local shell).
```

```text
relctl connect
```


## relctl connect check

verify current connection is working

```text
relctl connect check
```


## relctl connect github

connect initial to a GitHub or GitHub Enterprise

```text
relctl connect github [flags]
```

Flags:

```text
  -r, --repository string   (required) repo eg.: octo-org/octo-repo
  -s, --server string       github instance to connect, default: https://github.com (default "https://github.com")
  -t, --token string        token used to verify the connection, not stored (default: $GITHUB_TOKEN)
```


## relctl connect remove

remove the connection file (and a legacy .awesomerc.yaml)

```text
relctl connect remove
```

