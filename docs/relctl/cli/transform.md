---
sidebar_position: 6
title: transform
---

:::note
This page is generated from the command line of relctl. Do not edit it by hand.
:::

# relctl transform

transform given input to json

```text
relctl transform
```


## relctl transform group-by

group string array by prefix to json

```text
relctl transform group-by [flags]
```

Flags:

```text
  -p, --prefix int       group by prefix until index -- eg.: 'st1_base-image' and int 3, will be grouped by 'st1' (default 3)
      --sub-prefix int   remove prefix until index number -- eg.: 'st1_base-image' and 4 will be 'base-image'
```

Examples:

```text
relctl tf group-by -p 3 --sub-prefix 4 st1_infrastructure-base  st2_ubi9-openjdk-11  st2_ubi9-openjdk-17 
   produces: {"st1":["infrastructure-base"],"st2":["ubi9-openjdk-11","ubi9-openjdk-17"]}
```

