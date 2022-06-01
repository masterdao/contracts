import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MockToken } from '../types';
import { IdoCoinContract } from '../types/IDO/ido.sol';
import { ERC20 } from '../types/token';

import { idoFixture } from './fixtures/ido';
import { deploy, loadFixture, run } from './helper';

const { parseEther, formatEther } = ethers.utils;

describe('ido contract', () => {
  let dao: ERC20;
  let ido: IdoCoinContract;
  let myToken: MockToken;
  let owner: SignerWithAddress;
  before(async () => {
    const setup = await loadFixture(idoFixture);
    ido = setup.ido as any;
    dao = setup.dao as any;
    myToken = (await deploy(
      'MockToken',
      'myToken',
      'MTK',
      parseEther('1000000'),
    )) as any;
    [owner] = await ethers.getSigners();
    console.log({
      dao: dao.address,
      ido: ido.address,
      token: myToken.address,
      owner: owner.address,
    });
    await run(ido.setregisterAmount, parseEther('1'));
  });

  it(`create project`, async () => {
    // console.log('ok');
    const head: IdoCoinContract.IdoCoinInfoHeadStruct = {
      coinAddress: myToken.address,
      symbol: await myToken.symbol(),
      decimals: await myToken.decimals(),
      collectType: 1,
      idoAmount: parseEther('100'),
      price: 1,
      bBuyLimit: false,
      uBuyLimitNumber: 1,
      bPartner: false,
      partnerNumber: 0,
      bDAO: false,
      uDAONumber: 0,
      // 秒
      expireTime: Date.now() + 86400,
    };
    await run(dao.approve, ido.address, parseEther('1'));
    await run(myToken.approve, ido.address, parseEther('100'));
    await run(ido.createIeoCoin, head);

    // validation
    const idoCoin = await ido.getidoCoin(myToken.address);
    expect(idoCoin).not.null;
    expect(idoCoin.idoCoinHead.coinAddress).eq(myToken.address);
  });

  it.skip(`IPO subscription`, async () => {
    const balance = await owner.getBalance();
    console.log('balance', formatEther(balance));

    const amount = parseEther('1');

    // 如果 collectType == 1, 必须传 value, 且 value >= amount
    await run(ido.IPOsubscription, myToken.address, amount, {
      value: amount,
    });

    const balance2 = await owner.getBalance();
    console.log('balance2', formatEther(balance2));
  });
});
