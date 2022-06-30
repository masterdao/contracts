import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import {
  ERC20,
  DAOMintingPool,
  IdoCoinContract,
  IdovoteContract,
  SwapContract,
} from '../types';
import { createCliTable } from '../utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  const depDAO = await deployments.get(contracts.dao.name);
  const depVeDAO = await deployments.get(contracts.vedao.name);
  const depVoting = await deployments.get(contracts.voting.name);
  const depSwap = await deployments.get(contracts.swap.name);
  const depIdo = await deployments.get(contracts.ido.name);

  const table = createCliTable({
    head: ['contracts', 'addresss'],
    colWidths: [12, 46],
  });

  table.push(
    ['DAO', depDAO.address],
    ['POOL', depVeDAO.address],
    ['Vote', depVoting.address],
    ['Swap', depSwap.address],
    ['IDO', depIdo.address],
    ['Owner', deployer],
  );

  console.log('\nArtifacts:');
  console.log(table.toString(), '\n');
};

export default func;
