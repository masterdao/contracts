import { ethers } from 'hardhat';

async function main() {
  // dao token
  const DAOToken = await ethers.getContractFactory(
    'contracts/src/multisig_token/ERC20.sol:ERC20'
  );
  const daoToken = await DAOToken.deploy('DAO', 'DAO');
  await daoToken.deployed();
  console.log(`daoToken deployed to: ${daoToken.address}`);

  // _IDAOMintingPool
  const DAOMintingPool = await ethers.getContractFactory('DAOMintingPool');
  const daoMintingPool = await DAOMintingPool.deploy();
  await daoMintingPool.deployed();
  console.log(`daoMintingPool deployed to: ${daoMintingPool.address}`);

  // ido contract
  const IdoCoinContract = await ethers.getContractFactory('idoCoinContract');
  const idoCoinContract = await IdoCoinContract.deploy(
    daoToken.address,
    daoMintingPool.address
  );
  await idoCoinContract.deployed();
  console.log(`idoCoinContract deployed to: ${idoCoinContract.address}`);

  // deploy mock token only for test
  const MockToken = await ethers.getContractFactory('MockToken');
  const mockToken = await MockToken.deploy('1000000000000000');
  await mockToken.deployed();
  console.log(`mockToken deployed to: ${mockToken.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
