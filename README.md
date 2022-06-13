# Contracts Test

This branch just for testing contracts

## Run test

### 1. merge from main branch

```sh
git merge main
```

### 2. install dependencies

```sh
npm install
```

### 3. run test suite

```sh
npm run test
# or
npx hardhat test test/**/*.test.ts
```

## Commit Convention 提交约定

本库参与编辑的开发人员较多，为方便维护与合作，本库使用 cc(conventional-commit) 对代码提交进行约定。

详细约定请参考 https://www.conventionalcommits.org/zh-hans/v1.0.0/

使用 [commitlint](https://github.com/conventional-changelog/commitlint) 对提交消息执行检测和约束。
使用 [husky](https://typicode.github.io/husky/#) 管理 [git hooks](https://git-scm.com/docs/githooks)。

详细使用方式请参考对应工具。
