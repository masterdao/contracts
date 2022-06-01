import { Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { contracts, deployDAO, deploy, run } from '../helper';
import { poolFixture } from './pool';
const { parseEther, formatEther } = ethers.utils;

// 部署各个合约，添加默认矿池类型和矿池
export async function idoFixture() {
  const [owner] = await ethers.getSigners();
  const dao = await deployDAO(100000);
  const { pool } = await poolFixture({
    pools: [
      {
        lpToken: dao.address,
        multiple: 2,
        poolType: 0,
      },
    ],
  });
  const vote = await deploy(contracts.idoVote, dao.address, pool.address);
  const weth = await deploy(contracts.weth);

  // 部署一个测试环境的 uniswap
  const factory = await deploy(contracts.uniswapV2.factory, owner.address);
  const router = await deploy(
    contracts.uniswapV2.router,
    factory.address,
    weth.address,
  );

  // pair DAO/ETH
  await run(factory.createPair, dao.address, weth.address);

  // const pair = await factory.getPair(dao.address, weth.address);
  //                        pair.address or router.address ?
  // await run(dao.approve, router.address, parseEther('10000'));
  // await run(weth.approve, router.address, parseEther('100'));

  // DAO:ETH = 100:1
  // await run(
  //   router.addLiquidity,
  //   dao.address,
  //   weth.address,
  //   parseEther('10000'),
  //   parseEther('10'),
  //   parseEther('1'),
  //   parseEther('1'),
  //   owner.address,
  //   Date.now() + 3600 * 1000, //30mins
  // );

  const ido = await deploy(
    contracts.ido,
    dao.address,
    pool.address,
    vote.address,
    router.address,
  );

  return {
    dao,
    factory,
    router,
    ido,
    pool,
    vote,
  };
}

type Options = {
  token?: {
    name?: string;
    // 默认 'MTK'
    symbol?: string;
    // 默认 1,000,000
    initSupply?: number;
  };
  ido?: {
    // 发行数量, 默认 100
    amount?: number;
    // 币价(币对比例): 默认 1
    price?: number;
    // 投票过期时间? 单位秒, 默认 60
    expire?: number;
  };
};

// 部署各矿池，并按参数添加 ido 项目及其代币
export function createIdoFixture(opt: Options) {
  const options = opt || {};
  const symbol = options.token?.symbol || 'MTK';
  return async function () {
    // this token will be used to create an ido coin, you can deploy it out of this fixture.
    const token = await deploy(
      'MockToken',
      options.token?.name || symbol,
      symbol,
      parseEther(String(options.token?.initSupply || 1000000)),
    );
    const setup = await idoFixture();
    const idoAmount = parseEther(String(options.ido?.amount || 100));
    const project = {
      coinAddress: token.address,
      symbol,
      decimals: 18,
      collectType: 1,
      idoAmount,
      price: options.ido?.price || 1,
      bBuyLimit: false,
      uBuyLimitNumber: 1,
      bPartner: false,
      partnerNumber: 0,
      bDAO: false,
      uDAONumber: 0,
      expireTime: Date.now() + (options.ido?.expire || 60) * 1000,
    };
    await run(setup.dao.approve, setup.ido.address, parseEther('1'));
    await run(token.approve, setup.ido.address, idoAmount);
    await run(setup.ido.createIeoCoin, project);
    return {
      ...setup,
      token,
    };
  };
}
