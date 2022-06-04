import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { contracts, deployDAO, deploy, run, deployMockToken } from '../helper';
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
    // 默认 18
    decimals?: number;
  };
  ido?: {
    // 项目发起者, 不提供则为 ido 的 owner
    founder?: SignerWithAddress;
    // 发行数量, 默认 100
    amount?: number;
    // 币价(币对比例), 精度6位: 默认 1
    price?: number;
    // 投票过期时间? 单位秒, 默认 60
    expire?: number;
    // 募资币 id
    collectType?: number;
  };
};

// 部署各矿池，并按参数添加 ido 项目及其代币
export function createIdoFixture(opt: Options) {
  const options = opt || {};
  const symbol = options.token?.symbol || 'MTK';

  return async function () {
    const [owner] = await ethers.getSigners();
    const founder = options.ido?.founder || owner;
    // this token will be used to create an ido coin, you can deploy it out of this fixture.
    const token = await deployMockToken({
      name: options.token?.name || symbol,
      symbol,
      initSupply: options.token?.initSupply || 1000000,
      owner: founder,
    });

    if (options.token?.decimals) {
      await token.connect(founder).setDecimals(options.token.decimals);
    }

    const setup = await idoFixture();

    if (founder.address != owner.address) {
      await setup.dao.transfer(founder.address, parseEther('100'));
    }

    const idoAmount = parseEther(String(options.ido?.amount || 100));

    const project = {
      coinAddress: token.address,
      symbol,
      decimals: 18,
      collectType: options.ido?.collectType || 1,
      idoAmount,
      // 6 位精度
      price: (options.ido?.price || 1) * 1e6,
      bBuyLimit: false,
      uBuyLimitNumber: 1,
      bPartner: false,
      partnerNumber: 0,
      bDAO: false,
      uDAONumber: 0,
      // 单位秒
      expireTime: Math.floor(Date.now() / 1000) + (options.ido?.expire || 0),
    };

    // 以 founder 身份创建 ido 项目
    await run(
      setup.dao.connect(founder).approve,
      setup.ido.address,
      parseEther('1'),
    );
    await run(token.connect(founder).approve, setup.ido.address, idoAmount);
    await run(setup.ido.connect(founder).createIeoCoin, project);

    return {
      ...setup,
      token,
    };
  };
}
