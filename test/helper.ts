import { Fixture } from '@ethereum-waffle/provider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, waffle } from 'hardhat';

type ContractInfo = {
  name: string;
  artifact?: string;
};

/** 合约配置 */
export const contracts = {
  dao: {
    // name: 'ERC20',
    name: 'src/token/ERC20.sol:ERC20',
  },
  vedao: {
    name: 'DAOMintingPool',
  },
  ido: {
    name: 'idoCoinContract',
  },
  idoVote: {
    name: 'idovoteContract',
  },
  uniswapV2: {
    factory: 'UniswapV2Factory',
    router: 'UniswapV2Router02',
  },
  weth: {
    name: 'WETH9',
  },
};

/** 部署合约 */
export async function deploy(info: ContractInfo | string, ...args: any[]) {
  if (typeof info === 'string') {
    info = {
      name: info,
    };
  }

  const factory = await ethers.getContractFactory(info.name);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  return contract;
}

/** 包装了 transaction 调用，仅为了可读性 */
export async function run<T extends Function>(func: T, ...args: any[]) {
  const tx = await func(...args);
  return await tx.wait();
}

/** 部署并发行 DAO */
export async function deployDAO(
  /** 初始发行数量 */
  initTotal = 100000,
  /** 多签账户 */
  accounts?: SignerWithAddress[],
  /** 最少同意账户数量 */
  multiNumber = 1,
  name = 'DAO token',
  symbol = 'DAO',
) {
  const dao = await deploy(contracts.dao, name, symbol);

  // accounts 列表不存在，根据 multiNumber 设置默认的 accounts
  if (!accounts || accounts.length === 0) {
    const wallets = await ethers.getSigners();
    accounts = wallets.slice(0, multiNumber);
  }

  // 设置多签地址
  for (const account of accounts) {
    await run(dao.setmultiAddress, account.address);
  }
  await run(dao.setmultiNumber, multiNumber);

  // 提案
  await run(dao.startmultisignatureperiod);

  // 发币
  await run(dao.mint, initTotal);
  return dao;
}

/** 加载测试夹具 */
export async function loadFixture<T>(fixture: Fixture<T>) {
  const { provider, createFixtureLoader } = waffle;
  const accounts = provider.getWallets();
  const load = createFixtureLoader(accounts, provider);
  return await load(fixture);
}
