import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { createContractWithSigner, run } from '../utils';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  ethers
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { contracts } = cfg;
  const { vedao } = contracts

  const depDAO = await deployments.get(contracts.dao.name);

  const artifact = await deploy(contracts.vedao.name, {
    from: deployer,
    args: [],
  });

  console.log('address: vedao\t', artifact.address);

  const contract = await createContractWithSigner<DAOMintingPool>(artifact, ethers);

  const {addPoolTypes, addPools} = vedao;


  // 添加 pool types
  // if(addPoolTypes.enable && addPoolTypes.items?.length) {
  //   for (const {length, weight} of addPoolTypes.items) {
  //     await run(contract.addmintingPoolType, length, weight);
  //   }

  //   // 添加 pools
  //   if(addPools.enable && addPools.items?.length) {
  //     for (const item of addPools.items) {
  //       let {
  //         lpToken,
  //         // 默认1倍
  //         multiple = 1,
  //         poolTypeId
  //       } = item;
  //       if(lpToken === 'ERC20') {
  //         lpToken = depDAO.address
  //       }
  //       await run(contract.addmintingPool, lpToken, multiple, poolTypeId);
  //     }
  //   }
  // }

  // 所有权转移
  if(vedao.owner && vedao.owner !== deployer) {
    await run(contract.transferOwnership, vedao.owner)
  }
};

export default func;
