import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ERC20 } from '../types/src/token/ERC20';
import { run, contracts, deploy } from './helper';

describe('DAO token test', () => {
  let contract: ERC20;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;

  beforeEach(async () => {
    contract = (await deploy(contracts.dao, 'DAO token', 'DAO')) as any;
    [owner, account1] = await ethers.getSigners();
  });

  it(`deployment should success`, async () => {
    expect(await contract.name()).to.equals('DAO token');
    expect(await contract.symbol()).to.equals('DAO');
    expect(await contract.owner()).to.equals(owner.address);
  });

  it(`set multiple signature addresses should success`, async () => {
    // add two accounts
    await Promise.all(
      [owner, account1].map((account) =>
        run(contract.setmultiAddress, account.address),
      ),
    );

    const length = await contract.getmultiAddresslength();
    expect(length).to.equals(2);

    // retrive two addresses
    const addresses = await Promise.all(
      [0, 1].map((i) => contract.getmultiAddressinfo(i)),
    );

    expect(addresses).deep.equals([owner.address, account1.address]);
  });
});

describe('mint', () => {
  let contract: ERC20;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;

  before(async () => {
    contract = (await deploy(contracts.dao, 'DAO token', 'DAO')) as any;
    [owner, account1] = await ethers.getSigners();

    await (await contract.setmultiAddress(owner.address)).wait();
    await (await contract.setmultiAddress(account1.address)).wait();
    await (await contract.setmultiNumber(1)).wait();
  });

  it('minting DAO', async () => {
    // proposal
    await run(contract.startmultisignatureperiod);

    // mint 100 ether DAO
    const amount = 100;

    // WARN: this unit is ether, NOT wei!
    await run(contract.mint, amount);

    // WARN: but it's wei in here, NOT ether
    const total = await contract.totalSupply();
    expect(total).equals(ethers.utils.parseEther('100'));

    const balance = await contract.balanceOf(owner.address);
    expect(balance).equals(total);
  });
});
