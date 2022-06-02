import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ERC20 } from '../types';
import { DAOMintingPool } from '../types/DAOMintingPoolV2/DAOMintingPool';
import { contracts, deploy, deployDAO, run } from './helper';

describe('DAOMinitingPool contract test', () => {
  let contract: DAOMintingPool;
  let dao: ERC20;
  let owner: SignerWithAddress;

  before(async () => {
    contract = (await deploy(contracts.pool)) as any;
    dao = (await deployDAO()) as any;
    [owner] = await ethers.getSigners();
  });

  it(`should add minting pool type`, async () => {
    // pool duration time: one week, unit: second
    const duration = 7 * 24 * 3600;
    // WARN: 正整数，千分位
    const weight = 100; // 100‰ = 10%
    await run(contract.addmintingPoolType, duration, weight);

    const size = await contract.getmintingPoolTypeSize();
    expect(size).equals(1);

    const poolType = await contract.getmintingPoolType(0);

    expect(poolType.id).equals(0);
    expect(poolType.poolLength).equals(7 * 24 * 3600);
    expect(poolType.weight).equals(100);
  });

  it(`should add minting pool`, async () => {
    const lpToken = dao.address;
    const multiple = 2.0; // 出矿倍数 10分之一
    const poolTypeId = 0;

    // add a minting pool
    await run(contract.addmintingPool, lpToken, multiple, poolTypeId);

    // retrive and validate
    const pool = await contract.getlistmintingPooldata(0);
    expect(pool.lpToken).eq(dao.address);
    expect(pool.lpTokensymbol).eq('DAO');
    expect(pool.multiple).eq(2);
    expect(pool.stakingTotal).eq(0);
  });

  // NOTE: 该测试方式不正确，每个测试要纯净的前置条件，而该测试使用了其它测试的副作用
  it(`deposit`, async () => {
    const lpToken = dao.address;
    // 质押 100 个 DAO
    const amount = ethers.utils.parseEther('100');
    const poolTypeId = 0;

    // DAO 授权 MintingPool 合约
    await run(dao.approve, contract.address, amount);
    // 质押 DAO
    await run(contract.deposit, lpToken, amount, poolTypeId);

    // validation
    const info = await contract.getminerInfo(
      owner.address,
      lpToken,
      poolTypeId,
    );

    expect(info.amount).eq(amount);
    expect(info.veDao).eq(amount.mul(2).div(10));
  });

  it(`TODO:提取收益`);
});
