import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { createContractWithSigner, run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import * as hre from 'hardhat';
// import { ethers } from 'ethers';
import { IdovoteContract } from '../types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  const depDAO = await deployments.get(contracts.dao.name);
  const depVeDAO = await deployments.get(contracts.vedao.name);

  const { voting } = contracts;
  // 部署
  const artifact = await deploy(voting.name, {
    from: deployer,
    args: [depDAO.address, depVeDAO.address],
  });

  console.log('address: voting\t', artifact.address);

  // 初始化
  const contract = await createContractWithSigner<IdovoteContract>(
    artifact,
    ethers,
  );
};
export default func;
