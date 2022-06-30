import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { createCliTable, createContractWithSigner, run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import { parseEther } from 'ethers/lib/utils';

const cfg = require('../deployment.config');

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  ethers,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;
  const { vedao } = contracts;

  let daoAddress = contracts.dao.address;
  if (!daoAddress) {
    const depDAO = await deployments.get(contracts.dao.name);
    daoAddress = depDAO.address;
  }

  // taks1: deploy
  const artifact = await deploy(contracts.vedao.name, {
    from: deployer,
    args: [],
  });

  console.log('address: vedao\t', artifact.address);

  // 非新部署的合约跳过后续任务
  if (!artifact.newlyDeployed) return;

  const contract = await createContractWithSigner<DAOMintingPool>(
    artifact,
    ethers,
  );

  const { addPoolTypes, addPools } = vedao;

  // task2: addPoolTypes
  if (addPoolTypes.enabled && addPoolTypes.items?.length) {
    for (const { length, weight } of addPoolTypes.items) {
      await run(contract.addmintingPoolType, length, weight, {
        gasLimit: 1200000,
      });
    }
    await printPoolTypes(contract);

    // task3: addPools
    if (addPools.enabled && addPools.items?.length) {
      for (const item of addPools.items) {
        let {
          lpToken,
          // 默认1倍
          multiple = 1,
          poolTypeId,
        } = item;

        if (lpToken === 'ERC20') {
          lpToken = daoAddress;
        }
        await run(contract.addmintingPool, lpToken, multiple, poolTypeId, {
          gasLimit: 1200000,
        });
      }

      await printPools(contract);
    }
  }

  // task3: addBonusToken
  if (vedao.addBonusToken?.enabled) {
    for (const item of vedao.addBonusToken.items || []) {
      let [name, bsToken, amount, timeinms] = item;
      const timeinsec = Math.floor(timeinms / 1000);
      if (bsToken === 'ERC20') {
        bsToken = daoAddress;
      }

      await run(
        contract.addBonusToken,
        name,
        bsToken,
        parseEther(String(amount)),
        timeinsec,
      );
    }

    // TODO: printBonusList
  }
  // 所有权转移
  // if(vedao.owner && vedao.owner !== deployer) {
  //   await run(contract.transferOwnership, vedao.owner)
  // }
};

export default func;

async function getPoolTypes(vedao: DAOMintingPool) {
  const length = await vedao.getmintingPoolTypeSize();
  return Promise.all(
    Array.from({ length: length.toNumber() }).map(async (_, i) => {
      const type = await vedao.getmintingPoolType(i);
      return {
        id: type.id.toNumber(),
        length: type.poolLength.toNumber(),
        weight: type.weight.toNumber(),
      };
    }),
  );
}

async function getPools(vedao: DAOMintingPool) {
  const length = await vedao.getlistmintingPool();
  return Promise.all(
    Array.from({ length: length.toNumber() }).map(async (_, i) => {
      const item = await vedao.getlistmintingPooldata(i);
      return {
        id: i,
        symbol: item.lpTokensymbol,
        timestamp: item.timestamps.toNumber(),
        poolTypeId: item.poolTypeId.toNumber(),
        lpToken: item.lpToken,
        stakingTotal: item.stakingTotal,
        multiple: item.multiple.toNumber(),
      };
    }),
  );
}

async function printPoolTypes(vedao: DAOMintingPool) {
  const table = createCliTable({
    head: ['id', 'length', 'weight'],
    colWidths: [4, 10, 10],
  });
  const items = await getPoolTypes(vedao);

  items.forEach((item) => {
    table.push([item.id, item.length, item.weight]);
  });

  console.log('\nPoolTypes:');
  console.log(table.toString(), '\n');
}

async function printPools(vedao: DAOMintingPool) {
  // const poolTypes = await getPoolTypes(vedao);
  const items = await getPools(vedao);

  const table = createCliTable({
    head: ['index', 'symbol', 'lpToken', 'poolType', 'multiple'],
    colWidths: [7, 8, 46, 10, 10],
  });

  items.forEach((item) => {
    table.push([
      item.id,
      item.symbol,
      item.lpToken,
      item.poolTypeId,
      item.multiple,
    ]);
  });

  console.log('\n Pools');
  console.log(table.toString(), '\n');
}
