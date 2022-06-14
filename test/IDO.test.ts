import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { ethers, network } from 'hardhat';
import { MockToken } from '../types';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import { IdoCoinContract } from '../types/src/IDO/ido.sol';
import { IdovoteContract } from '../types/src/IDO/idovote.sol/IdovoteContract';
import { ERC20 } from '../types/src/token';

import { createIdoFixture, idoFixture } from './fixtures/ido';
import { deploy, loadFixture, run,helper } from './helper';

const { parseEther, formatEther } = ethers.utils;

describe('ido contract', () => {
  let dao: ERC20;
  let ido: IdoCoinContract;
  let myToken: MockToken;
  let owner: SignerWithAddress;
  let ipoId: string;

  describe('IPO base on ETH', () => {
    let token: MockToken;
    let user: SignerWithAddress;
    // 项目发起者
    let founder: SignerWithAddress;
    const price = 0.001;

    before(async () => {
      [owner, user, founder] = await ethers.getSigners();
      const fixture = createIdoFixture({
        token: { symbol: 'MTK', decimals: 17 },
        ido: {
          amount: 1000,
          founder,
          collectType: 1,
          price,
          expire: 24*3600, // ipo 时长 24小时
        },
      });
      
      const setup = await fixture();
      ido = setup.ido as any;
      dao = setup.dao as any;
      token = setup.token as any;
      ipoId = setup.coinAddress;
      // owner 质押/投票/让投票通过
      await makeVotePass(setup as any);

    });

    it(`IPOsubscription`, async () => {
      const buyerBalance = await user.getBalance();

      // 让 user 去打新 1 ETH
      const amount = parseEther('0.001');
      // 如果 collectType == 1, 必须传 value, 且 value >= amount

      const rec = await run(
        ido.connect(user).IPOsubscription,
        ipoId,
        amount,
        {
          value: amount,
        },
      );

      // validation
      const afterBuyerBalance = await user.getBalance();
      // user 余额减少了 1ETH + gas
      expect(afterBuyerBalance).equals(buyerBalance.sub(amount).sub(rec.gas));

      const coin = await ido.getidoCoin(ipoId);
      expect(coin.ipoCollectAmount).equals(amount);
      // idoAmountTotal 是可用项目币总数
    });

    it('withdraw', async () => {
      // 等待 ipo 结束
      await helper.time.increase(25 * 3600) // 时间增加25小时
      // 管理员先对项目进行结算
      await run(ido.connect(owner).settlement, ipoId);

      const oldBalance = await user.getBalance();
      // 10**10 是 100%
      // const winningRate = ethers.utils.parseUnits('10', 'gwei');
      const amount = parseEther('1');

      const { winningRate, makeCoinAmount } = getEncryptMakeAmount(
        1,
        amount,
        user.address,
      );

      // 用户对自己进行结算(首次提现前)
      const rec1 = await run(ido.connect(user).settleaccounts, ipoId, winningRate, makeCoinAmount);

      // 用户提现 (planId: 1 只提现一次，提现全部)
      const rec2 = await run(
        ido.connect(user).withdraw,
        ipoId,
      );

      const gas = rec1.gas.add(rec2.gas);

      // validation
      const tokenBalance = await token.balanceOf(user.address);
      expect(tokenBalance).equals(amount);

      const newBalance = await user.getBalance();

      // 旧余额 + 退回 eth(当前为0) - gas = 新余额
      expect(newBalance).equals(oldBalance.add(parseEther('0')).sub(gas));
    });

    // 项目方提币
    it.skip('takeOut', async () => {
      // 获得执行前状态
      const [oldBalance, oldTokenBalance, oldDaoBalance] = await Promise.all([
        founder.getBalance(),
        token.balanceOf(founder.address),
        dao.balanceOf(founder.address),
      ]);

      // 项目方提币, planId:1 一次提取所有币
      const rec = await run(ido.connect(founder).takeOut, ipoId);

      // validation
      const [balance, tokenBalance, daoBalance] = await Promise.all([
        founder.getBalance(),
        token.balanceOf(founder.address),
        dao.balanceOf(founder.address),
      ]);

      // 提了 0.3ETH
      expect(balance).equals(oldBalance.add(parseEther('0.5')).sub(rec.gas));
      // 退回 500 Mytoken
      expect(tokenBalance, "should got 500 token").equals(oldTokenBalance.add(parseEther('500')));
      // 退回1注册费
      expect(daoBalance.sub(oldDaoBalance).eq(parseEther('1')));
    });
  });

  describe('createIeoCoin', () => {

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
        startTime: Math.floor(Date.now() / 1000),
        bundle: 0,
        maxbundle: 0,
        planId: 0,
        expireTime: 0,
      };
      await run(dao.approve, ido.address, parseEther('1'));
      await run(myToken.approve, ido.address, parseEther('100'));
      const res = await run(ido.createIeoCoin, head);

      const event = res.events.find((e: any) => e.event === 'CreateIeoCoin');
      expect(event).not.null;
      const id = event.args.newCoinAddress

      // validation
      const idoCoin = await ido.getidoCoin(id);
      expect(idoCoin).not.null;
      expect(idoCoin.idoCoinHead.coinAddress).eq(myToken.address);
    });
  });

  describe.skip(`shouldn't withdraw more than once`, () => {
    let token: MockToken;
    let user: SignerWithAddress;
    // 项目发起者
    let founder: SignerWithAddress;
    const price = 0.001;
    let ipoId: string

    before(async () => {
      [owner, user, founder] = await ethers.getSigners();
      const fixture = createIdoFixture({
        token: { symbol: 'MTK', decimals: 17 },
        ido: {
          amount: 1000,
          founder,
          collectType: 1,
          price,
          expire: 24*3600,
        },
      });

      const setup = await fixture();
      // const setup = await loadFixture(fixture);
      ido = setup.ido as any;
      dao = setup.dao as any;
      token = setup.token as any;
      ipoId = setup.coinAddress;
      // owner 质押/投票/让投票通过
      await makeVotePass(setup as any);

      // ipo prepurchase
      const amount = parseEther('0.001');
      // 如果 collectType == 1, 必须传 value, 且 value >= amount
      await run(ido.connect(user).IPOsubscription, ipoId, amount, {
        value: amount,
      });

      console.log('ipoId', ipoId);
      await helper.time.increase(25*3600);

      console.log('settlement')
      await run(ido.connect(owner).settlement, ipoId);
    });

    it(`rewithdraw`, async () => {
      const amount = parseEther('1');

      const { winningRate, makeCoinAmount } = getEncryptMakeAmount(
        1,
        amount,
        user.address,
      );

      await run(ido.connect(user).settleaccounts,
        token.address,
        winningRate,
        makeCoinAmount
      );

      await run(
        ido.connect(user).withdraw,
        token.address,
      );

      await expect(
        ido.connect(user).withdraw(token.address),
      ).revertedWith('already take out');
    });
  });
});

// 该过程模拟服务器计算规则
function getEncryptMakeAmount(
  /** 胜率 (0~1] */
  winRate: number,
  amount: BigNumber,
  walletAddress: string,
) {
  if (winRate > 1) throw `winRate should less than 1`;
  if (winRate <=0) throw `winRate should greater than 0`;
  const winningRate = Math.floor(winRate * 1e10);

  const makeCoinAmount = ethers.BigNumber.from(walletAddress)
    .mod(1e10)
    .add(amount);
  return {
    winningRate: BigNumber.from(winningRate),
    makeCoinAmount,
  };
}

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
  // console.log('mvp result', result);
  // 验证确保投票通过
  if (!result.bEnd || !result.bSuccessOrFail) {
    throw 'vote not passed';
  }
}

// 将 amount 专为 human readable
function objf(obj: any) {
  const out: any = {};
  for (const key in obj) {
    if (!isNaN(key as any)) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (BigNumber.isBigNumber(value)) {
        if (key.match(/amount/gi)) {
          out[key] = formatEther(value);
        } else {
          out[key] = value.toNumber();
        }
      } else if (typeof value === 'object') {
        out[key] = objf(value);
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}
