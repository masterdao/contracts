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
      name: 'ERC20',
      // 1. 部署任务
      deploy: { name: 'DAO Token', symbol: 'DAO' },

      // 2. 多签任务 (可选)
      multsign: {
        enabled: false,
        // 账户列表
        accounts: [],
        //法定人数
        count: 1,
      },

      // 3. 空投(可选)
      airdrop: {
        enabled: false,
        // 白名单账户每户空投 DAO 的数量
        count: 10000,
        whiteList: [
          '0x262d48605c8b6157a67AC41baDCfb20d377F7a0a',
          '0xA6d06F387EBe64ad341BC4E512bfd60f85cBDcF5',
        ],
      },

      // 4. 所有权转移 (可选)
      owner: '' as string | undefined,
    },

    vedao: {
      name: 'DAOMintingPool',
      // 1. 部署任务
      deploy: {},

      // 2. 添加矿池类型(可选)
      addPoolTypes: {
        enable: false,
        items: [{ length: 7 * 24 * 3600, weight: 5 }],
      },

      // 3. 添加矿池，依赖 2（可选）
      addPools: {
        enable: true,
        items: [
          {
            // ERC20 代币地址，ERC20 为关键字，特指命名合约 ERC20(DAO)
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
    },

    ido: {
      name: 'idoCoinContract',

      // 1. 部署任务
      deploy: {
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },

      // 2. ido 地址注入 voting 合约
      setidoCoinContract: {
        enabled: true,
      },
    },
  },
};

if (config.accounts.length === 0 || !config.accounts[0]) {
  console.log(`请配置部署账号，可使用环境变量 DEPLOY_ACCOUNT_PRIVATE_KEY`);
}

export default config;
