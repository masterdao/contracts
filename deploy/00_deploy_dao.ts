import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { ERC20 } from '../types/src/token/ERC20';
import { createContractWithSigner, run } from '../utils';
import { parseEther } from 'ethers/lib/utils';

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  ethers,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const {
    contracts: { dao },
  } = cfg;

  // 部署任务
  const artifact = await deploy(dao.name, {
    contract: 'src/token/ERC20.sol:ERC20',
    from: deployer,
    args: [dao.deploy.name, dao.deploy.symbol],
  });

  console.log('address: dao \t', artifact.address);
  const contract = await createContractWithSigner<ERC20>(artifact, ethers);

  // 多签任务
  if (dao.multsign.enabled && dao.multsign.accounts.length) {
    for (const account of dao.multsign.accounts) {
      await run(contract.setMultiAddress, account);
    }
    await run(contract.setMultiNumber, dao.multsign.count);
  }

  // 空投
  // if(dao.airdrop.enabled && dao.airdrop.whiteList) {
  //   const {whiteList, count} = dao.airdrop
  //   const wei = parseEther(String(count))
  //   for (const account of whiteList) {
  //     console.log('airdrop', count, 'DAO to', account)
  //     await run(contract.transfer, account, wei)
  //   }
  // }

  // 所有权转移
  // if(dao.owner && deployer !== dao.owner) {
  //   await run(contract.transferOwnership, dao.owner)
  // }
};

export default func;
