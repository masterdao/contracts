import { ethers } from 'hardhat';
type ContractInfo = {
  name: string;
};

export const contracts = {
  dao: {
    name: 'ERC20',
  },
  vedao: {
    name: 'DAOMintingPool',
  },
};

/** 部署合约 */
export async function deploy(info: ContractInfo, ...args: any[]) {
  const factory = await ethers.getContractFactory(info.name);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  return contract;
}

/** 包装了 transaction 调用，仅为了可读性 */
export async function run<T extends Function>(func: T, ...args: any[]) {
  const tx = await func(...args);
  return await tx.wait();
}

/** 部署并发行 DAO */
export async function deployDAO(initTotal = 100000) {
  const dao = await deploy(contracts.dao, 'DAO token', 'DAO');
  const [owner] = await ethers.getSigners();
  // 设置多签
  await run(dao.setmultiAddress, owner.address);
  await run(dao.setmultiNumber, 1);

  // 提案
  await run(dao.startmultisignatureperiod);

  // 发币
  await run(dao.mint, initTotal);
  return dao;
}
