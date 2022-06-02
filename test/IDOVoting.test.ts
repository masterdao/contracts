import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { loadFixture, run } from './helper';
import { createIdoFixture } from './fixtures/ido';
import { MockToken } from '../types';
import { DAOMintingPool } from '../types/src/DAOMintingPoolV2';
import { IdovoteContract } from '../types/src/IDO/idovote.sol';
import { ERC20 } from '../types/src/token/ERC20';
import { expect } from 'chai';

const { parseEther, formatEther } = ethers.utils;

describe('idovote.sol vote', () => {
  // 项目方代币
  let token: MockToken;
  let pool: DAOMintingPool;
  let dao: ERC20;
  let user1: SignerWithAddress;
  let vote: IdovoteContract;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    const fixture = createIdoFixture({
      token: { symbol: 'GLD' },
    });
    const setup = await loadFixture(fixture);
    // token = setup.token as any;
    pool = setup.pool as any;
    vote = setup.vote as any;
    dao = setup.dao as any;
    token = setup.token as any;

    [owner, user1] = await ethers.getSigners();
    const amount = parseEther('100');
    // 转给 user1 100 个 DAO
    // 全部拿去质押给 poolTypeId = 0
    await run(dao.transfer, user1.address, amount);
    await run(dao.connect(user1).approve, pool.address, amount);
    await run(pool.connect(user1).deposit, dao.address, amount, 0);
  });

  it(`vote by regular member`, async () => {
    const info = await vote.getvotecoin(token.address);
    expect(info.bOpen).is.false;
    await run(vote.connect(user1).vote, token.address, true);

    // validation;
    const info2 = await vote.getvotecoin(token.address);
    expect(info2.bOpen).is.true;

    const userInfo = await vote.connect(user1).getVoteRecord(token.address);
    expect(userInfo.bVoted).to.be.true;
    expect(userInfo.bStatus).to.be.true;
  });
});
