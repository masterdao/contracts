import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from 'hardhat/builtin-tasks/task-names';
import { HardhatUserConfig, subtask } from 'hardhat/config';
import path from 'path';
// import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-solhint';

// skip paths
const excludes = [/\/INO\//, /idovote\scopy/];

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(
  async (_, __, runSuper) => {
    let paths = await runSuper();
    return paths.filter((p: string) => !excludes.some((exp) => p.match(exp)));
    return paths;
  },
);

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.7.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  /** @see https://github.com/wighawag/hardhat-deploy/tree/master#1-namedaccounts-ability-to-name-addresses */
  namedAccounts: {
    deployer: 0,
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      live: false,
      saveDeployments: true,
      tags: ['test', 'local'],
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      gas: 12000000,
      chainId: 31337,
      blockGasLimit: 6721975,
      timeout: 40000,
      // TODO: 将开发人员不同配置移入环境变量
      // accounts: [
      //   '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      // ],
      live: false,
      saveDeployments: true,
      tags: ['local'],
    },
    rinkeby: {
      chainId: 0x4,
      url: 'https://rinkeby.infura.io/v3/',
      live: true,
      saveDeployments: true,
      tags: ['staging'],
    },
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
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
  },
  paths: {
    sources: './src',
  },
  // external: {
  //   contracts: [
  //     {
  //       artifacts: 'node_modules/@uniswap/v2-core/build',
  //     },
  //     {
  //       artifacts: 'node_modules/@uniswap/v2-periphery/build',
  //     },
  //     {
  //       artifacts: 'node_modules/canonical-weth/build',
  //     },
  //   ],
  // },
};

export default config;
