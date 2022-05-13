import { ethers, Wallet } from 'ethers';

import {
  DAOMintingPool,
  DAOMintingPool__factory,
  ERC20,
  ERC20__factory,
  IdoCoinContract,
  IdoCoinContract__factory,
  IdovoteContract,
  IdovoteContract__factory,
  MockToken,
  MockToken__factory,
} from '../../typechain-types';

interface IDOFixture {
  daoMintingPool: DAOMintingPool;
  idovoteContract: IdovoteContract;
  mockToken: MockToken;
  daoToken: ERC20;
  idoCoinContract: IdoCoinContract;
}

export async function idoFixture(
  [wallet]: Wallet[],
  _provider: ethers.providers.JsonRpcProvider
): Promise<IDOFixture> {
  const DAOMintingPoolFactory = new DAOMintingPool__factory(wallet);
  const daoMintingPool = await DAOMintingPoolFactory.deploy();

  const ERC20Factory = new ERC20__factory(wallet);
  const daoToken = await ERC20Factory.deploy('DAO', 'DAO');

  const IdovoteContractFactory = new IdovoteContract__factory(wallet);
  const idovoteContract = await IdovoteContractFactory.deploy(
    daoToken.address,
    daoMintingPool.address
  );
  const IdoCoinContractFactory = new IdoCoinContract__factory(wallet);
  const idoCoinContract = await IdoCoinContractFactory.deploy(
    daoToken.address,
    daoMintingPool.address
  );

  const MockTokenFactory = new MockToken__factory(wallet);
  const mockToken = await MockTokenFactory.deploy(
    ethers.utils.parseEther('1000')
  );

  await mockToken.approve(idoCoinContract.address, ethers.constants.MaxUint256);

  return {
    daoMintingPool,
    daoToken,
    mockToken,
    idovoteContract,
    idoCoinContract,
  };
}
