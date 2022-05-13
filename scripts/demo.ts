import { ethers } from 'hardhat';

import {
  IdoCoinContract,
  IdoCoinContract__factory,
  MockToken__factory,
} from '../typechain-types';

async function main() {
  // IdoCoinContract__factory.connect(, provider);
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const idoCoin: IdoCoinContract = await IdoCoinContract__factory.connect(
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    deployer
  );

  // create coin first
  const GDAOContract = MockToken__factory.connect(
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    deployer
  );
  await GDAOContract.approve(idoCoin.address, ethers.constants.MaxUint256);
  await idoCoin.createIeoCoin(
    {
      coinAddress: GDAOContract.address,
      symbol: 'GDAO',
      decimals: 18,
      collectType: 1,
      idoAmount: 10000000000000,
      price: 20000000,
      bBuyLimit: false,
      uBuyLimitNumber: 1,
      bPartner: false,
      partnerNumber: 0,
      bDAO: false,
      uDAONumber: 0,
      blockTime: 9968289,
      openTime: 864000,
    },
    { value: ethers.utils.parseEther('1') }
  );
  await idoCoin.addapplyCoin(GDAOContract.address, 'MockToken', 18);
}

main().catch(console.error);
