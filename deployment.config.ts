// 部署配置文件
require('dotenv').config();

type Networks = {
  [name: string]: { url: string; accounts?: string[] };
};

const config = {
  accounts: [
    // 部署账号 私钥, 必填
    process.env.DEPLOYER_PRIVATE_KEY,
  ] as string[],
  // 网络配置
  networks: {
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/7ef77c7be8e64f2f9272d68d4ce8deeb',
      // accounts: []
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/7ef77c7be8e64f2f9272d68d4ce8deeb',
    },
  } as Networks,
  // 合约配置
  contracts: {
    dao: {
      // 合约名，勿随意改动
      name: 'ERC20',
      // 1. 部署任务
      deploy: { name: 'DAO Token', symbol: 'DAO' },

      // 2. 多签任务 (可选)
      multsign: {
        enabled: true,
        // 账户列表, deployer 已默认被添加
        accounts: process.env.DAO_MULTISIGN_ACCOUNTS,
        //法定人数
        count: 1,
      },

      // 3. 发行 DAO, 依赖 2:multsign
      mint: {
        enable: true,
        // 单位 ether
        count: 1000000000,
      },

      // 4. 空投(可选), 依赖 3:发行DAO
      airdrop: {
        enabled: true,
        // 白名单账户每户空投 DAO 的数量
        count: 10000,
        whiteList: [
          '0x00129F23b74196e66A926D0d53c9E9faBaADa5eD',
          '0xA6d06F387EBe64ad341BC4E512bfd60f85cBDcF5',
        ],
      },
    },

    vedao: {
      name: 'DAOMintingPool',
      // 1. 部署任务
      deploy: {},

      // 2. 添加矿池类型(可选)
      addPoolTypes: {
        enabled: true,
        items: [
          { length: 7 * 24 * 3600, weight: 10 },
          { length: 60, weight: 2 },
        ],
      },

      // 3. 添加矿池，依赖 2（可选）
      addPools: {
        enabled: true,
        items: [
          {
            // ERC20 代币地址，ERC20 特指DAO合约
            lpToken: 'ERC20',
            // 整数
            multiple: 2,
            poolTypeId: 0,
          },
        ],
      },

      // 4: 所有权转移 (可选)
      owner: undefined,
    },

    voting: {
      name: 'idovoteContract',

      // 1. 部署任务
      deploy: {},

      // 2. 设置默认投票时长
      setVoteTime: {
        enabled: true,
        // 单位: 秒
        value: 24 * 3600,
      },

      setPassingRate: {
        enabled: true,
        // 设置投票通过率
        value: 1,
      },

      // 投票合法通过率
      setVotingRate: {
        enabled: true,
        // 百分比
        value: 1,
      },
    },

    swap: {
      name: 'swapContract',
      deploy: {
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },
    },

    ido: {
      name: 'idoCoinContract',

      // 1. 部署任务
      deploy: {
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },

      setPlan: {
        enabled: true,
        items: [[100], [80, 20], [50, 30, 20]],
      },

      setRegisterAmount: {
        enabled: true,
        // 单位 ether
        value: 1,
      },

      // 设置 IPO 时长
      setIpoTime: {
        enabled: true,
        value: 5 * 24 * 3600,
      },
    },
  },
};

if (config.accounts.length === 0 || !config.accounts[0]) {
  console.log(`请配置部署账号，可使用环境变量 DEPLOY_ACCOUNT_PRIVATE_KEY`);
}

export default config;
