import { Fixture } from '@ethereum-waffle/provider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers, waffle} from 'hardhat';
import { ERC20 } from '../types/src/token/ERC20';
import * as _helper from '@nomicfoundation/hardhat-network-helpers';

export const helper = _helper

type ContractInfo = {
  name: string;
  artifact?: string;
};

/** 合约配置 */
export const contracts = {
  dao: 'src/token/ERC20.sol:ERC20',
  pool: 'DAOMintingPool',
  ido: 'idoCoinContract',
  idoVote: 'idovoteContract',
  uniswapV2: {
    factory: 'UniswapV2Factory',
    router: 'UniswapV2Router02',
  },
  weth: 'WETH9',
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

export const BIG_ZERO =  BigNumber.from(0)

/** 包装了 transaction 调用，仅为了可读性 */
export async function run<T extends Function>(func: T, ...args: any[]) {
  const tx = await func(...args);
  const rec =  await tx.wait();
  const {gasUsed=BIG_ZERO, effectiveGasPrice=1} = rec
  return {
    ...rec,
    // 计算 gas 费
    gas: gasUsed.mul(effectiveGasPrice)
  }
}

export async function deployMockToken(
  options: {
    name?: string;
    symbol?: string;
    initSupply?: number;
    owner?: SignerWithAddress;
  } = {},
) {
  let {
    name = 'MyToken',
    symbol = 'MTK',
    initSupply = 1000000,
    owner,
  } = options;
  if (!owner) {
    [owner] = await ethers.getSigners();
  }
  const supply = ethers.utils.parseEther(String(initSupply));
  const fac = await ethers.getContractFactory('MockToken', owner);
  const token = await fac.deploy(name, symbol, supply);
  await token.deployed();
  return token;
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
    await run(dao.setMultiAddress, account.address);
  }
  await run(dao.setMultiNumber, multiNumber);

  // 提案
  await run(dao.startMultiSignaturePeriod);

  // 发币
  await run(dao.mint, initTotal);
  return dao as ERC20;
}

/** 加载测试夹具 */
export async function loadFixture<T>(fixture: Fixture<T>) {
  const { provider, createFixtureLoader } = waffle;
  const accounts = provider.getWallets();
  const load = createFixtureLoader(accounts, provider);
  return load(fixture);
}

export function delay(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
