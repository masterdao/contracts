import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
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
          expire: 30,
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
      const amount = parseEther('0.001');
      // 如果 collectType == 1, 必须传 value, 且 value >= amount
      const rec = await run(
        ido.connect(user).IPOsubscription,
        token.address,
        amount,
        {
          value: amount,
        },
      );

      // validation
      const afterBuyerBalance = await user.getBalance();
      const gas = rec.gasUsed.mul(rec.effectiveGasPrice);
      // user 余额减少了 1ETH + gas
      expect(afterBuyerBalance).equals(buyerBalance.sub(amount).sub(gas));

      const coin = await ido.getidoCoin(token.address);
      // console.log('idoCoin', objf(coin));
      expect(coin.ipoCollectAmount).equals(amount);
      // idoAmountTotal 是可用项目币总数
    });

    it('withdraw', async () => {
      const oldBalance = await user.getBalance();
      // 10**10 是 100%
      // const winningRate = ethers.utils.parseUnits('10', 'gwei');
      const amount = parseEther('1');
      const { winningRate, makeCoinAmount } = getEncryptMakeAmount(
        1,
        amount,
        user.address,
      );

      // console.log('withdraw', {
      //   amount,
      //   wallet: user.address,
      //   modAddress: BigNumber.from(user.address).mod(1e10).toNumber(),
      //   amountEth: formatEther(amount),
      //   makeAmount: formatEther(makeCoinAmount),
      // });

      const rec = await run(
        ido.connect(user).withdraw,
        token.address,
        winningRate,
        makeCoinAmount,
      );

      // validation
      const tokenBalance = await token.balanceOf(user.address);
      expect(tokenBalance).equals(amount);

      const newBalance = await user.getBalance();
      const gas = rec.gasUsed.mul(rec.effectiveGasPrice);
      // 旧余额 + 退回 eth - gas = 新余额
      expect(newBalance).equals(oldBalance.add(parseEther('0')).sub(gas));
    });

    // 项目方提币
    it('takeOut', async () => {
      // 等待项目完成ipo
      await delay(8000);
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
      const rec = await run(ido.connect(founder).takeOut, token.address);

      const gas = rec.gasUsed.mul(rec.effectiveGasPrice);

      // validation
      const [balance, tokenBalance, daoBalance] = await Promise.all([
        founder.getBalance(),
        token.balanceOf(founder.address),
        dao.balanceOf(founder.address),
      ]);

      // 提了 0.3ETH
      expect(balance).equals(oldBalance.add(parseEther('0.3')).sub(gas));
      // 退回 500
      expect(tokenBalance).equals(oldTokenBalance.add(parseEther('500')));
      // 退回1注册费
      // expect(daoBalance.sub(oldDaoBalance).eq(parseEther('1')));
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

  describe(`shouldn't withdraw more than once`, () => {
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
          expire: 30,
        },
      });

      const setup = await fixture();
      // const setup = await loadFixture(fixture);
      ido = setup.ido as any;
      dao = setup.dao as any;
      token = setup.token as any;
      // owner 质押/投票/让投票通过
      await makeVotePass(setup as any);

      // ipo prepurchase
      const amount = parseEther('0.001');
      // 如果 collectType == 1, 必须传 value, 且 value >= amount
      await run(ido.connect(user).IPOsubscription, token.address, amount, {
        value: amount,
      });
    });

    it(``, async () => {
      const amount = parseEther('1');

      const { winningRate, makeCoinAmount } = getEncryptMakeAmount(
        1,
        amount,
        user.address,
      );

      await run(
        ido.connect(user).withdraw,
        token.address,
        winningRate,
        makeCoinAmount,
      );

      await expect(
        ido.connect(user).withdraw(token.address, winningRate, makeCoinAmount),
      ).revertedWith('already withdraw');
    });
  });
});

function getEncryptMakeAmount(
  winRate: number,
  amount: BigNumber,
  walletAddress: string,
) {
  if (winRate > 1) throw `winRate shouldnt great than 1`;
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
  // 验证确保投票通过
  if (result.bOpen || !result.bEnd || !result.bSuccessOrFail) {
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
