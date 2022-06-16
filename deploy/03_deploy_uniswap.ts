import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import * as hre from 'hardhat';
import { IdovoteContract } from '../types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  // TODO: 部署 UniswapV2Factory
  // TODO: 部署 WETH, 如果没有地址的话
  // TODO: 部署 UniswapV2Router02
  // console.log('uniswap do nothing');
};

func.tags = ['local'];
export default func;
