import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { createContractWithSigner, run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import * as hre from 'hardhat';
import { IdovoteContract } from '../types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  const { swap } = contracts;

  if ((swap as any).skip) return;

  const artifact = await deploy(swap.name, {
    from: deployer,
    args: [swap.deploy.router],
  });

  console.log('address: swap\t', artifact.address);
  if (!artifact.newlyDeployed) return;

  const contract = await createContractWithSigner(artifact, ethers);
};

func.tags = ['local'];
export default func;
