---
sidebar_position: 5
title: parse
---

# relctl parse

Inspect and parse JSON and YAML files to retrieve values — similar to `jq` with additional features.

```bash
relctl parse [flags]
```

```
  -h, --help      help for parse
  -v, --verbose   verbose output
```

## parse json

```bash
relctl parse json [flags]
```

```
  -f, --file string     JSON file to parse
  -q, --query string    jq-style query expression
```

## parse yaml

```bash
relctl parse yaml [flags]
```

```
  -f, --file string     YAML file to parse
  -q, --query string    query expression
```

## parse version

Validate a version string against semver syntax.

```bash
relctl parse version [flags]
```

```
  -v, --version string   version string to validate
```
