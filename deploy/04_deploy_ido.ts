import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import {
  createCliTable,
  createContractWithSigner,
  getContractList,
  run,
} from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import { IdoCoinContract, IdovoteContract } from '../types';
import { formatEther, parseEther } from 'ethers/lib/utils';

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
  const depVoting = await deployments.get(contracts.voting.name);
  const depSwap = await deployments.get(contracts.swap.name);
  const depTool = await deployments.get(contracts.tool.name);

  const { ido } = contracts;

  if ((ido as any).skip) {
    return;
  }
  // 部署合约
  const artifact = await deploy(ido.name, {
    from: deployer,
    args: [
      daoAddress,
      depVeDAO.address,
      depVoting.address,
      depSwap.address,
      depTool.address,
    ],
  });

  // console.log('address: ido\t', artifact.address);

  // 初始化
  const contract = await createContractWithSigner<IdoCoinContract>(
    artifact,
    ethers,
  );

  // #region 设置 voting 合约 ido 合约地址
  const votingContract = await createContractWithSigner<IdovoteContract>(
    depVoting,
    ethers,
  );

  await run(votingContract.setidoCoinContract, artifact.address);

  // console.log(
  //   'voting.getidoCoinContract',
  //   await votingContract.getidoCoinContract(),
  // );
  // #endregion
  // #region 设置 vedao 合约的 ido 合约地址
  const vedaoContract = await createContractWithSigner<DAOMintingPool>(
    depVeDAO,
    ethers,
  );

  await run(vedaoContract.setIdoAddress, artifact.address);
  // console.log('vedao.getidoAddress', await vedaoContract.getidoAddress());

  // console.log('ido new?', artifact.newlyDeployed);
  if (artifact.newlyDeployed) {
    if (ido.setPlan?.enabled) {
      // console.log('setPlan');
      let id = 1;
      for (const percents of ido.setPlan.items) {
        let length = percents.length;
        // console.log('set', id, percents, length);
        for (const percent of percents) {
          await run(contract.setPlan, id, percent, length, {
            gasLimit: 1200000,
          });
        }
        id++;
      }

      await printPlans(contract);
    }

    if (ido.setRegisterAmount?.enabled) {
      const { value = 1 } = ido.setRegisterAmount;
      await run(contract.setregisterAmount, parseEther(String(value)));
    }

    if (ido.setIpoTime?.enabled) {
      const { value = 24 * 36000 } = ido.setIpoTime;
      await run(contract.setipoTime, value);
    }
  }

  await printGlobalSettings(contract);
  // #endregion
};

export default func;

async function printPlans(ido: IdoCoinContract) {
  const length = await ido.getplanListlength();
  // const plans: any[] = [];
  const table = createCliTable({
    head: ['plainId', 'length', 'plans'],
    colWidths: [10, 9, 30],
  });
  for (let i = 0; i < length.toNumber(); i++) {
    const id = await ido.getplanListdata(i);
    const size = await ido.getPlanNumber(id);

    const percents = await Promise.all(
      Array.from({ length: size.toNumber() }).map((_, i) => ido.getPlan(id, i)),
    );

    table.push([id, size.toNumber(), percents.map((i) => i + '%').join(',')]);
  }

  console.log('\n IDO Plans:');
  console.log(table.toString(), '\n');
}

async function printGlobalSettings(ido: IdoCoinContract) {
  const props = ['registerAmount', 'ipoTime'];

  const table = createCliTable({
    head: ['name', 'value'],
    colWidths: [15, 46],
  });

  const [registerAmount, ipoTime] = await Promise.all([
    ido.getregisterAmount(),
    ido.ipoTime(),
  ]);

  table.push(
    ['registerAmount', formatEther(registerAmount)],
    ['ipoTime', ipoTime.toNumber()],
  );
  console.log('\nIDO Global Settings:');
  console.log(table.toString(), '\n');
}
