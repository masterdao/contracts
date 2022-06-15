# Contracts

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

## Test

```sh
npm run test:all
# or
npx hardhat test test/**/*.test.ts
```

## 提交前

本库使用 [husky](https://typicode.github.io/husky/#) 管理 [git hooks](https://git-scm.com/docs/githooks)。

详细使用方式请参考对应工具。

本 repository 提交前会执行 `npm run format` 和 `npm run compile`，分别进行代码格式化和合约编译。

**编译未通过无法提交。**

## 部署

### 部署前准备

部署前请配置部署账户私钥，通过环境变量 `DEPLOYER_PRIVATE_KEY` 设置，或复制 `.env.sample` 为 `.env` 文件，修改其中相应的变量。

部署配置详见 `deployment.config.ts`

### 本地部署

1. 启动本地节点

```sh
npm run dev
```

2. 本地部署

```sh
npm run deploy:localhost
```

### Rinkeby 部署

```sh
npm run deploy:rinkeby
```
