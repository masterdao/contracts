import { Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { contracts, deployDAO, deploy, run } from '../helper';

export async function idoFixture() {
  const { parseEther, formatEther } = ethers.utils;
  const [owner] = await ethers.getSigners();
  const dao = await deployDAO(100000);
  const vedao = await deploy(contracts.vedao);
  const vote = await deploy(contracts.idoVote, dao.address, vedao.address);
  const weth = await deploy(contracts.weth);

  // uniswap
  const factory = await deploy(contracts.uniswapV2.factory, owner.address);
  const router = await deploy(
    contracts.uniswapV2.router,
    factory.address,
    weth.address,
  );

  // this token will be used to create an ido coin, you can deploy it out of this fixture.
  const token = await deploy(
    'MockToken',
    'Mock token',
    'MTK',
    parseEther('100000'),
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
    vedao.address,
    vote.address,
    router.address,
  );

  return {
    token,
    dao,
    factory,
    router,
    ido,
  };
}
