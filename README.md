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

## 提交前

本库使用 [husky](https://typicode.github.io/husky/#) 管理 [git hooks](https://git-scm.com/docs/githooks)。

详细使用方式请参考对应工具。

本 repository 提交前会执行 `npm run format` 和 `npm run compile`，分别进行代码格式化和合约编译。

**编译未通过无法提交。**
