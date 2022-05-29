# 合约测试

本分支为的合约测试

## 运行测试

### 1. 合并主分支
```sh
git merge main
```
### 2. 安装依赖
```sh
# 安装依赖
npm install
```

### 3.运行测试套件

```sh
npm run test
# 或者
npx hardhat test test/**/*.test.ts
```