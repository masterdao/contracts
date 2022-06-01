import { ethers } from 'hardhat';
import { contracts, deployDAO, deploy, run } from '../helper';
const { parseEther, formatEther } = ethers.utils;
import { DAOMintingPool } from '../../types/DAOMintingPoolV2/DAOMintingPool';
import { BigNumberish } from 'ethers';

// 生成默认的 fixture 创建 pool 合约并添加默认的 poolTpye 和 pool
type CreatePoolFixtureOptions = {
  poolTypes?: Array<{
    length: number;
    weight: number;
  }>;
  pools: Array<{
    lpToken: string;
    multiple: BigNumberish;
    poolType: number;
  }>;
};
export async function poolFixture(options: CreatePoolFixtureOptions) {
  const pool: DAOMintingPool = (await deploy(contracts.pool)) as any;

  // add default minting pool types
  for (const { length, weight } of options.poolTypes || [
    { length: 7 * 24 * 3600, weight: 200 },
  ]) {
    await run(pool.addmintingPoolType, length, weight);
  }
  // add default minting pools
  for (const { lpToken, multiple, poolType } of options.pools) {
    await run(pool.addmintingPool, lpToken, multiple, poolType);
  }

  return { pool };
}
