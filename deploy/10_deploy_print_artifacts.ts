import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import {
  ERC20,
  DAOMintingPool,
  IdoCoinContract,
  IdovoteContract,
  SwapContract,
} from '../types';
import { createCliTable } from '../utils';
const cfg = require('../deployment.config');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  let daoAddress = contracts.dao.address;
  if (!daoAddress) {
    const depDAO = await deployments.get(contracts.dao.name);
    daoAddress = depDAO.address;
  }
  const depVeDAO = await deployments.get(contracts.vedao.name);
  const depVoting = await deployments.get(contracts.voting.name);
  const depSwap = await deployments.get(contracts.swap.name);
  const depIdo = await deployments.get(contracts.ido.name);

  const table = createCliTable({
    head: ['contracts', 'addresss'],
    colWidths: [12, 46],
  });

  table.push(
    ['DAO', daoAddress],
    ['POOL', depVeDAO.address],
    ['Vote', depVoting.address],
    ['Swap', depSwap.address],
    ['IDO', depIdo.address],
    ['Owner', deployer],
    ['Router', contracts.swap.deploy.router],
  );

  console.log('\nArtifacts:');
  console.log(table.toString(), '\n');
};

export default func;
