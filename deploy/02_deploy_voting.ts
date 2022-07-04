import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { createCliTable, createContractWithSigner, run } from '../utils';
// import { ethers } from 'ethers';
import { IdovoteContract } from '../types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers, deployConfig: cfg } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;

  let daoAddress = contracts.dao.address;
  if (!daoAddress) {
    const depDAO = await deployments.get(contracts.dao.name);
    daoAddress = depDAO.address;
  }
  const depVeDAO = await deployments.get(contracts.vedao.name);

  const { voting } = contracts;

  if ((voting as any).skip) return;
  // 部署
  const artifact = await deploy(voting.name, {
    from: deployer,
    args: [daoAddress, depVeDAO.address],
  });

  console.log('address: voting\t', artifact.address);

  if (!artifact.newlyDeployed) return;

  // 初始化
  const contract = await createContractWithSigner<IdovoteContract>(
    artifact,
    ethers,
  );

  const { setPassingRate, setVoteTime, setVotingRate } = voting;

  for (const [task, method] of [
    [setPassingRate, contract.setpassingRate],
    [setVoteTime, contract.setVoteTime],
    [setVotingRate, contract.setvotingRatio],
  ]) {
    await runTask(task, method);
  }

  await printGlobalSettings(contract);
};

export default func;

async function runTask(task: any, method: any) {
  if (task.enabled) {
    await run(method, task.value);
  }
}

async function printGlobalSettings(voting: IdovoteContract) {
  const [passingRate, voteTime, votingRate] = await Promise.all([
    voting.getpassingRate(),
    voting.getVoteTime(),
    voting.getvotingRatio(),
  ]);

  const table = createCliTable({
    head: ['voteTime', 'passingRate', 'votingRate'],
    colWidths: [10, 16, 16],
  });
  table.push([voteTime, passingRate, votingRate]);
  console.log('\nVoting Global Settings');
  console.log(table.toString(), '\n');
}
