import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MockToken } from '../types';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import { IdoCoinContract } from '../types/src/IDO/ido.sol';
import { IdovoteContract } from '../types/src/IDO/idovote.sol/IdovoteContract';
import { ERC20 } from '../types/src/token';

import { createIdoFixture, idoFixture } from './fixtures/ido';
import { delay, deploy, loadFixture, run } from './helper';

const { parseEther, formatEther } = ethers.utils;

describe('ido contract', () => {
  let dao: ERC20;
  let ido: IdoCoinContract;
  let myToken: MockToken;
  let owner: SignerWithAddress;

  describe('IPO base on ETH', () => {
    let token: MockToken;
    let user: SignerWithAddress;
    // 项目发起者
    let founder: SignerWithAddress;
    before(async () => {
      [owner, user, founder] = await ethers.getSigners();
      const fixture = createIdoFixture({
        token: { symbol: 'GLD' },
        ido: {
          founder,
          collectType: 1,
          price: 1, // 兑换比 1
          expire: 25,
        },
      });

      const setup = await fixture();
      // const setup = await loadFixture(fixture);
      ido = setup.ido as any;
      dao = setup.dao as any;
      token = setup.token as any;
      // owner 质押/投票/让投票通过
      await makeVotePass(setup as any);
    });

    it(`IPOsubscription`, async () => {
      const buyerBalance = await user.getBalance();

      // 让 user 去打新 1 ETH
      const amount = parseEther('1');
      // 如果 collectType == 1, 必须传 value, 且 value >= amount
      await run(ido.connect(user).IPOsubscription, token.address, amount, {
        value: amount,
      });

      // validation
      const afterBuyerBalance = await user.getBalance();
      // user 余额减少了 1ETH + some gas
      expect(afterBuyerBalance.lt(buyerBalance.sub(amount))).to.be.true;
    });

    it('withdraw', async () => {
      const oldBalance = await user.getBalance();
      // 10**10 是 100%
      const winningRate = ethers.utils.parseUnits('1', 'gwei');
      // 购买(提现 0.5 GLD, 剩余 ETH 退回)
      const amount = parseEther('0.5');

      const makeCoinAmount = ethers.BigNumber.from(user.address)
        .mod(1e10)
        .add(amount);

      await run(
        ido.connect(user).withdraw,
        token.address,
        winningRate,
        makeCoinAmount,
      );

      // validation
      const tokenBalance = await token.balanceOf(user.address);
      expect(tokenBalance).equals(parseEther('0.5'));

      const newBalance = await user.getBalance();
      // newBalance 大于 old 表明已退回(大概吧，除非 gas 超过 0.5 ETH)
      expect(newBalance).gt(oldBalance);
    });

    // 项目方提币
    it('takeOut', async () => {
      // 等待项目完成ipo
      await delay(15000);
      // 1. 管理员结算项目方资金
      await ido.settlement(token.address);

      // 2. 管理员设置提币数量
      await ido.setTakeOut(token.address, parseEther('0.3'));

      // 获得执行前状态
      const [oldBalance, oldTokenBalance, oldDaoBalance] = await Promise.all([
        founder.getBalance(),
        token.balanceOf(founder.address),
        dao.balanceOf(founder.address),
      ]);

      // 3. 项目方提币
      await ido.connect(founder).takeOut(token.address);

      // validation
      const [balance, tokenBalance, daoBalance] = await Promise.all([
        founder.getBalance(),
        token.balanceOf(founder.address),
        dao.balanceOf(founder.address),
      ]);

      // 提了 0.3ETH
      expect(balance.gt(oldBalance));
      expect(tokenBalance.eq(parseEther('99.5')));
      expect(daoBalance.sub(oldDaoBalance).eq(parseEther('1')));
    });
  });

  describe('createIeoCoin', () => {
    beforeEach(async () => {
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
        expireTime: Math.floor(Date.now() / 1000) + 10,
      };
      await run(dao.approve, ido.address, parseEther('1'));
      await run(myToken.approve, ido.address, parseEther('100'));
      await run(ido.createIeoCoin, head);

      // validation
      const idoCoin = await ido.getidoCoin(myToken.address);
      expect(idoCoin).not.null;
      expect(idoCoin.idoCoinHead.coinAddress).eq(myToken.address);
    });
  });
});

// async function waitFor(predicate: () => Promise<boolean>, overtime = 30000) {
//   return new Promise<void>((resolve, reject) => {
//     setTimeout(() => reject('over time'), overtime);
//     const itl = setInterval(() => {
//       predicate().then((ok) => {
//         if (ok) {
//           clearInterval(itl);
//           resolve();
//         }
//       });
//     }, 1000);
//   });
// }

async function makeVotePass({
  dao,
  token,
  vote,
  pool,
}: {
  dao: ERC20;
  token: MockToken;
  vote: IdovoteContract;
  pool: DAOMintingPool;
}) {
  // staking
  const stakeAmount = parseEther('100');
  await run(dao.approve, pool.address, stakeAmount);
  await run(pool.deposit, dao.address, stakeAmount, 0);

  // voting
  await run(vote.vote, token.address, true);

  // 使投票通过
  await run(vote.setVoteCoinEnd, token.address);
  const result = await vote.getvotecoin(token.address);
  // 验证确保投票通过
  if (result.bOpen || !result.bEnd || !result.bSuccessOrFail) {
    throw 'vote not passed';
  }
}
