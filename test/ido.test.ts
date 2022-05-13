import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import {
  DAOMintingPool,
  ERC20,
  IdoCoinContract,
  IdovoteContract,
  MockToken,
} from '../typechain-types';

import { idoFixture } from './shared/fixtures';

// chai.use(waffle.solidity);

describe('test ido', async () => {
  let daoMintingPool: DAOMintingPool;
  let idovoteContract: IdovoteContract;
  let mockToken: MockToken;
  let daoToken: ERC20;
  let idoCoinContract: IdoCoinContract;
  const provider = waffle.provider;
  const [wallet, other] = provider.getWallets();
  beforeEach(async () => {
    const loadFixture = waffle.createFixtureLoader([wallet], provider);
    const fixture = await loadFixture(idoFixture);
    daoMintingPool = fixture.daoMintingPool;
    idovoteContract = fixture.idovoteContract;
    mockToken = fixture.mockToken;
    daoToken = fixture.daoToken;
    idoCoinContract = fixture.idoCoinContract;
  });

  it('integration test', async () => {
    await expect(
      idoCoinContract.createIeoCoin(
        {
          coinAddress: mockToken.address,
          symbol: await mockToken.symbol(),
          decimals: await mockToken.decimals(),
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
      )
    ).to.be.not.reverted;
    // check result
    const idoCoin = await idoCoinContract.getidoCoin(mockToken.address);
    expect(idoCoin.bExpired).to.be.false;
    expect(idoCoin.buyNonce).to.eq(0);
    expect(idoCoin.idoCoinHead.collectType).to.eq(1);
    expect(idoCoin.idoCoinHead.coinAddress).to.eq(mockToken.address);


      // user IPOsubscription
      const amount = ethers.utils.parseEther("1");
      // await idoCoinContract.IPOsubscription(mockToken.address, amount, {value: amount});
  });

    it('applycoin test', async ()=>{
        const symbol = await mockToken.symbol();
        const decimals = await mockToken.decimals();
        // called by other
        await expect(idoCoinContract.connect(other).addapplyCoin(mockToken.address, symbol, decimals)).to.be.reverted;

        // called by owner
        expect(await idoCoinContract.getapplyCoinListLenght()).to.equal(1);
        expect(await idoCoinContract.getapplyCoinListData(0)).to.equal(1);
        // error
        expect(await idoCoinContract.getapplyCoinAddress(1)).to.equal(wallet.address);
        await expect(idoCoinContract.addapplyCoin(mockToken.address, symbol, decimals)).to.be.not.reverted;
        // check result
        expect(await idoCoinContract.getapplyCoinListLenght()).to.equal(2);
        expect(await idoCoinContract.getapplyCoinListData(1)).to.equal(2);
        expect(await idoCoinContract.getapplyCoinAddress(2)).to.equal(mockToken.address);
    });
});
