---
sidebar_position: 2.5
title: Supported systems
---

# Supported systems

relctl separates two things:

- the **source control system** (SCM) that holds the repository, the pull requests and the releases, and
- the **CI system** that runs relctl.

## Source control

| SCM | Status |
| --- | --- |
| GitHub (github.com) | supported |
| GitHub Enterprise | supported |
| GitLab | **not supported** |
| anything else | not supported |

If you need GitLab (or another system) as source control, please [open an issue](https://github.com/layer87-labs/relctl/issues) and describe your use case. relctl then tells you exactly that when it detects an unsupported system: *"GitLab is not supported as source control system … If you need GitLab as source control, please open an issue."*

## CI systems

Only two CI systems are detected from the environment. For everything else, connect once with `relctl connect github`.

| CI system | Detection | What you provide |
| --- | --- | --- |
| GitHub Actions | `CI=true`, `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY` | `GITHUB_TOKEN` as `env:` |
| Jenkins | `CI=true`, `JENKINS_URL`, `GIT_URL` | `GITHUB_REPOSITORY` (`owner/repo`) and `GITHUB_TOKEN` |
| GitLab CI, any other pipeline, your laptop | none (see below) | `relctl connect github --repository owner/repo` once, and `GITHUB_TOKEN` as environment variable on every call |

### GitLab CI and other pipelines: `relctl connect github`

relctl reads `CI_SERVER_URL`, `CI_PROJECT_URL` and `CI_JOB_TOKEN` as the credentials of a **GitLab** repository, so a GitLab CI job is treated as GitLab source control, which is not supported. If your repository is on GitHub and only the CI is GitLab CI, connect first:

```bash
export GITHUB_TOKEN=...                        # from the secrets of your CI system
relctl connect github --repository owner/repo   # verifies the connection, writes .relctl-connection.yaml
relctl release create ...                       # GITHUB_TOKEN must be set here as well
```

The connection file is read before the environment is inspected, so this works with and without GitLab's CI variables. The same applies to any other pipeline and to a local shell. Without `GITHUB_TOKEN`, relctl stops with a message that names the variable.

:::note The connection file holds no secret
`.relctl-connection.yaml` contains the server and the repository, nothing else. The token is used to verify the connection and is never written to disk; every call reads it from `GITHUB_TOKEN`. The file may be committed. Use a token with minimal scope and a short lifetime.

A `.awesomerc.yaml` from awesome-ci or from relctl before 2.10 is still read: its token is used when `GITHUB_TOKEN` is not set, and relctl warns. The next `relctl connect github` replaces it with `.relctl-connection.yaml` and deletes the old file, which held the token obscured with a key that is part of the public source code.
:::

### Jenkins with GitHub Enterprise

Jenkins sets `GIT_URL` to the URL of the repository (`https://ghe.example.com/org/repo.git` or `git@ghe.example.com:org/repo.git`). relctl derives the server (`https://ghe.example.com`) from it. To set the server explicitly, define `GITHUB_SERVER_URL`; it wins over `GIT_URL`.

## Release environment variables

Whatever the CI system, relctl exports `RELCTL_VERSION`, `RELCTL_TAG`, `RELCTL_NEXT_VERSION`, `RELCTL_RELEASE_ID`, `RELCTL_LATEST_VERSION` and further variables ([reference](./release-flows.md#variables)): to `$GITHUB_ENV` and as step outputs in GitHub Actions, to a file (`relctl.env`) elsewhere.
