---
sidebar_position: 3
title: parse
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl parse

inspect and parse JSON and YAML files to retrieve values, similar to jq with additional features

```text
relctl parse
```


## relctl parse json

parse a json string or file

```text
relctl parse json [flags]
```

Flags:

```text
  -f, --file string     file to be parsed
  -q, --query string    (required) query for output
  -s, --string string   query for output
```


## relctl parse version

Validate the given version string against semver syntax

```text
relctl parse version
```


## relctl parse yaml

parse a yaml string or file

```text
relctl parse yaml [flags]
```

Flags:

```text
  -f, --file string     file to be parsed
  -q, --query string    (required) query for output
  -s, --string string   query for output
```

