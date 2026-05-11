---
sidebar_position: 6
title: transform
---

# relctl transform

Transform input to JSON.

```bash
relctl transform [flags]
```

```
  -h, --help      help for transform
  -v, --verbose   verbose output
```

## transform group-by

Group a string array by prefix into a JSON map. Useful for grouping build matrix outputs by stage or category.

```bash
relctl transform group-by [flags]
```

```
  -h, --help             help for group-by
  -p, --prefix int       group by prefix until character index (default 3)
      --sub-prefix int   strip prefix until character index from values
```

### Example

```bash
relctl tf group-by -p 3 --sub-prefix 4 st1_infrastructure-base st2_ubi9-openjdk-11 st2_ubi9-openjdk-17
```

Output:

```json
{"st1":["infrastructure-base"],"st2":["ubi9-openjdk-11","ubi9-openjdk-17"]}
```
