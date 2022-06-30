import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import cfg from '../deployment.config';
import { ERC20 } from '../types/src/token/ERC20';
import {
  createCliTable,
  createContractWithSigner,
  getContractList,
  run,
} from '../utils';
import { formatEther, parseEther } from 'ethers/lib/utils';

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
  if (!artifact.newlyDeployed) return;

  const contract = await createContractWithSigner<ERC20>(artifact, ethers);

  // 2. 多签任务
  if (dao.multsign.enabled) {
    const accounts = (dao.multsign.accounts || '')
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);
    const addresses = new Set([...accounts, deployer]);
    for (const account of [...addresses]) {
      await run(contract.setMultiAddress, account);
    }
    await run(contract.setMultiNumber, dao.multsign.count || 1);

    await printMultiSignAccounts(contract);
  }

  // 3. 发币
  if (dao.mint?.enable) {
    const { count } = dao.mint;

    if (count) {
      await run(contract.startMultiSignaturePeriod);
      await run(contract.mint, count, { gasLimit: 1200000 });
    }

    printMint(contract, deployer);
  }

  // 空投
  if (dao.mint.enable && dao.airdrop.enabled && dao.airdrop.whiteList) {
    const { whiteList, count } = dao.airdrop;
    const wei = parseEther(String(count));
    for (const account of whiteList) {
      await run(contract.transfer, account, wei);
    }

    printAirdropResult(contract, whiteList);
  }

  // 所有权转移
  // if(dao.owner && deployer !== dao.owner) {
  //   await run(contract.transferOwnership, dao.owner)
  // }
};

export default func;

async function getMultiSignAccounts(dao: ERC20) {
  const item = await getContractList(
    dao.getMultiAddresslength,
    dao.getMultiAddressinfo,
  );
  return item;
}

async function printMultiSignAccounts(dao: ERC20) {
  const accounts = await getMultiSignAccounts(dao);
  const count = await dao.getMultiNumber();
  const table = createCliTable({ head: ['address'], colWidths: [46] });

  accounts.forEach((acc) => table.push([acc]));
  console.log('\nMultiSignature Accounts with count:', count.toNumber());
  console.log(table.toString(), '\n');
}

async function printMint(dao: ERC20, deployer: string) {
  const [totalSupply, minted, allTotal] = await Promise.all([
    dao.totalSupply(),
    dao.balanceOf(deployer),
    dao._alltotalsupply(),
  ]);
  const table = createCliTable({
    head: ['key', 'value'],
    colWidths: [18, 46],
  });
  table.push(
    ['minted', formatEther(minted)],
    ['totalSupply', formatEther(totalSupply)],
    ['allTotalSupply', formatEther(allTotal)],
  );
  console.log('\nMminting by', deployer);
  console.log(table.toString(), '\n');
}

async function printAirdropResult(dao: ERC20, whiteList: string[]) {
  const table = createCliTable({
    head: ['account', 'balance'],
    colWidths: [46, 20],
  });
  for (const account of whiteList) {
    const balance = await dao.balanceOf(account);
    table.push([account, formatEther(balance)]);
  }

  console.log('\nAirdrop Result');
  console.log(table.toString(), '\n');
}
