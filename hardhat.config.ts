import { task, HardhatUserConfig, subtask } from 'hardhat/config';
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from 'hardhat/builtin-tasks/task-names';
// import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
// import 'hardhat-gas-reporter';

// skip paths
const excludes = [/\/INO\//, /idovote\scopy/];

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(
  async (_, __, runSuper) => {
    const paths = await runSuper();
    return paths.filter((p: string) => !excludes.some((exp) => p.match(exp)));
  },
);

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: '0.8.9' },
      { version: '0.7.3' },
      { version: '0.5.0' },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      gas: 12000000,
      chainId: 31337,
      blockGasLimit: 6721975,
      timeout: 40000,
      // TODO: 将开发人员不同配置移入环境变量
      accounts: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ],
    },
    // ganache: {
    //   url: 'http://127.0.0.1:7545',
    //   accounts: [
    //     '0fb155089642ac82a79e7ce4b267a5ed09a64337da6c080dd19925251f8cc023',
    //   ],
    //   gas: 20000000000,
    //   blockGasLimit: 6721975,
    // },
    // rinkeby: {
    //   url: 'https://rinkeby.infura.io/v3/07a75043487f45079c2bb2f5f8b5d093',
    //   accounts: [
    //     '0x52cfa5a504bbf61d47dacfd66000936b21d88b832c535dfc4038d14b3bc3056d',
    //   ],
    // },
  },
  // gasReporter: {
  //   enabled: true,
  //   currency: 'USD',
  // },
  // etherscan: {
  //   // Your API key for Etherscan
  //   // Obtain one at https://etherscan.io/
  //   apiKey: 'FZ9PIAGUV2BN1V6QE6XMEZV2EJ13UNH4Y4',
  // },
  // typechain: {
  //   outDir: 'types',
  //   target: 'ethers-v5',
  // },
  paths: {
    sources: './src',
  },
};

export default config;
