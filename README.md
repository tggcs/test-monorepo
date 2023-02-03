# test-monorepo

## mono基础搭建

1. 文件夹

```shell
mkdir sheet ui utils
```

2. init

```shell
pnpm init
cd sheet
pnpm init
cd ../ui
pnpm init
cd ../utils
pnpm init
```

3. pnpm-workspace.yaml

add `pnpm-workspace.yaml`

```yaml
packages:
  - "sheet"
  - "ui"
  - "utils"
```
4. 添加代码功能

5. 添加引用
```yml
"dependencies": {
  "utils": "workspace:*",
  "ui": "workspace:*"
}
```

## 版本控制