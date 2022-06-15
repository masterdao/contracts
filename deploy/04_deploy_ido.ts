import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { createContractWithSigner, run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import * as hre from 'hardhat'
import { ethers } from 'ethers';
import { IdoCoinContract, IdovoteContract } from '../types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments,
    getNamedAccounts,
    ethers
  } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  const depDAO = await deployments.get(contracts.dao.name);
  const depVeDAO = await deployments.get(contracts.vedao.name);
  const depVoting = await deployments.get(contracts.voting.name)

  const {ido} = contracts

  // 部署合约
  const artifact = await deploy(ido.name, {
    from: deployer,
    args: [
      depDAO.address,
      depVeDAO.address,
      depVoting.address,
      ido.deploy.router
    ],
  });

  console.log('address: ido\t', artifact.address);

  // 初始化
  const contract = await createContractWithSigner<IdoCoinContract>(artifact, ethers);

  // 注入 daoContract.address
  if(ido.setidoCoinContract.enabled) {
    const votingContract = await createContractWithSigner<IdovoteContract>(depVoting, ethers);
    await run(votingContract.setidoCoinContract, artifact.address);
  }


};

function createContract<T>({address, abi}: any) {

}
export default func;
