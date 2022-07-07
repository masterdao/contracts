// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./IERC20.sol";
import "./SafeMath.sol";
import "./SafeERC20.sol";

interface IDAOMintingPool {
    function getminerVeDao(
        address who,
        address lpToken,
        uint256 poolTypeId
    ) external view returns (uint256);

    function getuserTotalVeDao(address who) external view returns (uint256); //获取用户总抵押veDao

    function getcalculatestakingAmount() external view returns (uint256);
}

interface IidoCoinContract {
    function getCoinInfo(address coinAddress)
        external
        view
        returns (
            uint256,
            bool,
            uint256
        );
}

/*
 * 投票 合约
 */
contract idovoteContract is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 public DAOToken;

    IDAOMintingPool public daoMintingPool;
    IidoCoinContract public idoCoinContract;
    uint256 private passingRate; //通过率，默认80/100
    uint256 private votingRatio; //投票率，默认50/100

    uint256 private totalStaking;
    uint256 private voteTime;
    uint256 private passRate; // IPO申购通过率
    address public ISMPolicy;
    mapping(address => address[]) vote_p_list; //用户参与投票的列表
    struct votePerson {
        address who;
        uint256 weight;
    }
    mapping(address => votePerson) voet_p_weight; //权重：开始1，正确1次，加0.1，错误一次减0.1  : 默认10，每次增加1，最后/10

    //用户信息
    struct peopleInfo {
        uint256 timestamp;
        uint256 veDao; // veDao数量
        bool bVoted; //是否投过这个币的票
        bool weightSettled; //是否统计权重
        bool bStatus;
        bool withdrawIncome; //是否支取过收益
    }
    mapping(address => mapping(address => peopleInfo)) votePeople;
    //币投票信息
    struct vcoinInfo {
        uint256 timestamp; //时间戳
        bool bCLose; //是否开始
        uint256 cpassingRate; //通过率
        uint256 cvotingRatio; //投票率
        uint256 voteVeDao; //总投票数
        uint256 pass; //通过数量
        uint256 deny; //拒绝数量
        bool bEnd; //是否结束
        bool bSuccessOrFail; //通过还是失败
        uint256 daoVoteIncome; //投票要分配的收益
    }
    mapping(address => vcoinInfo) votecoin;

    event SetpassingRate(address who, uint256 _passingRate);
    event SetvotingRatio(address who, uint256 _votingRatio);
    event Vote(address who, address coinAddress, bool bStatus);
    event SetVoteCoinEnd(address who, address coinAddress);
    event SetDaoVoteIncome(address who, address coinAddress, uint256 amount);
    event TokeoutVoteIncome(address who, uint256 peopleVoteIncome);
    event LogISMPolicyUpdated(address ISMPolicy);

    constructor(IERC20 _DAOToken, IDAOMintingPool _IDAOMintingPool) {
        initializeOwner();
        DAOToken = _DAOToken;
        daoMintingPool = _IDAOMintingPool;
        passingRate = 80;
        votingRatio = 50;
        ISMPolicy = msg.sender;
        voteTime = 86400 * 3;
        passRate = 70;
    }

    modifier onlyISMPolicy() {
        require(msg.sender == ISMPolicy || msg.sender == owner());
        _;
    }

    /**
     * @param ISMPolicy_ The address of the monetary policy contract to use for authentication.
     */
    function setISMPolicy(address ISMPolicy_) external onlyOwner {
        ISMPolicy = ISMPolicy_;
        emit LogISMPolicyUpdated(ISMPolicy);
    }

    //设定IDO合约地址
    function setidoCoinContract(address _idoCoinContract) public onlyOwner {
        require(_idoCoinContract != address(0));
        idoCoinContract = IidoCoinContract(_idoCoinContract);
    }

    //获取IDO合约地址
    function getidoCoinContract() public view returns (address) {
        return address(idoCoinContract);
    }

    //设定矿池合约地址
    function setdaoMintingPool(address poolAddr) public onlyISMPolicy {
        require(poolAddr != address(0));
        daoMintingPool = IDAOMintingPool(poolAddr);
    }

    //获取矿池地址
    function getdaoMintingPool() public view returns (address) {
        return address(daoMintingPool);
    }

    //管理员设定IPO通过率
    function setpassRate(uint256 _passRate) public onlyISMPolicy {
        require(_passRate > 0);
        passRate = _passRate;
    }

    //
    function getpassRate() public view returns (uint256) {
        return passRate;
    }

    //管理员设定投票时间
    function setVoteTime(uint256 _voteTime) public onlyISMPolicy {
        require(_voteTime > 0);
        voteTime = _voteTime;
    }

    function getVoteTime() public view returns (uint256) {
        return voteTime;
    }

    //设定通过率
    function setpassingRate(uint256 _passingRate) public onlyISMPolicy returns (uint256) {
        require(_passingRate > 0);
        passingRate = _passingRate;
        emit SetpassingRate(msg.sender, _passingRate);
        return _passingRate;
    }

    //获取通过率
    function getpassingRate() public view returns (uint256) {
        return passingRate;
    }

    //设定投票率
    function setvotingRatio(uint256 _votingRatio) public onlyISMPolicy returns (uint256) {
        require(_votingRatio > 0);
        votingRatio = _votingRatio;
        emit SetvotingRatio(msg.sender, _votingRatio);
        return _votingRatio;
    }

    //获取投票率
    function getvotingRatio() public view returns (uint256) {
        return votingRatio;
    }

    //获取币投票信息
    function getvotecoin(address coinAddress) public view returns (vcoinInfo memory) {
        require(coinAddress != address(0));
        return votecoin[coinAddress];
    }

    //获取用户投票权重
    function getVoetPeoperWeight(address who) public view returns (uint256) {
        require(who != address(0));
        return voet_p_weight[who].weight;
    }

    function getVotePeoperInfoSize(address who) public view returns (uint256) {
        require(who != address(0));
        uint256 count = vote_p_list[who].length;
        return count;
    }

    function getVotePeoperInfo(address who, uint256 index) public view returns (vcoinInfo memory) {
        require(who != address(0));
        require(index >= 0);
        uint256 count = getVotePeoperInfoSize(who);
        require(count >= 1, "vote is empty");
        return votecoin[vote_p_list[who][index]];
    }

    // 获取当前用户指定项目投票记录
    function getVoteRecord(address coinAddress) public view returns (peopleInfo memory) {
        require(coinAddress != address(0));
        return votePeople[msg.sender][coinAddress];
    }

    //获取IPO接受后，销售比率 0：未结束，1：超过70,2：小于70
    function getIopSuccOrFail(address coinAddress) public view returns (uint256) {
        (uint256 ipoRate, bool bend, ) = idoCoinContract.getCoinInfo(coinAddress);
        if (bend == false) {
            return 0;
        } else {
            if (ipoRate >= passRate) {
                return 1;
            } else {
                return 2;
            }
        }
    }

    function getPeopleVoteRate(address who) public view returns (uint256) {
        require(who != address(0));
        require(vote_p_list[who].length > 0, "you must be voted.");
        uint256 successCount = 0;
        uint256 closeVote = 0;
        for (uint256 i = 0; i < vote_p_list[who].length; i++) {
            address coinAddress = vote_p_list[who][i];
            if (votecoin[coinAddress].bSuccessOrFail) {
                successCount++;
            }
            if( votecoin[coinAddress].bCLose ){
                closeVote++;
            }
        }
        if(closeVote >0){
            return successCount.mul(10000).div(closeVote);
        }
        else{
            return 0;
        }
        
    }

    //投票
    function vote(address coinAddress, bool bStatus) public returns (bool) {
        require(coinAddress != address(0), "coinAddress can not be zero address.");
        require(daoMintingPool.getuserTotalVeDao(msg.sender) > 0, "veDao must be greater than 0.");
        require(votePeople[msg.sender][coinAddress].bVoted == false, "you have be voted."); //投过后，就不允许再次投票
        (, , uint256 ts) = idoCoinContract.getCoinInfo(coinAddress);
        require(ts != 0, "coin does not exist.");
        peopleInfo memory newpeopleInfo = peopleInfo({
            timestamp: block.timestamp,
            veDao: daoMintingPool.getuserTotalVeDao(msg.sender),
            bVoted: true,
            weightSettled: false,
            bStatus: bStatus,
            withdrawIncome: false
        });
        //开始初始化为权重为 10
        if (voet_p_weight[msg.sender].who == address(0)) {
            voet_p_weight[msg.sender].who = msg.sender;
            voet_p_weight[msg.sender].weight = 10;
        }
        votePeople[msg.sender][coinAddress] = newpeopleInfo;

        vote_p_list[msg.sender].push(coinAddress);

        for (uint256 i = 0; i < vote_p_list[msg.sender].length; i++) {
            //已经结束的票
            if (votecoin[vote_p_list[msg.sender][i]].bEnd) {
                //如果没有统计过权重的，开始统计用户权重
                if (votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled == false) {
                    if (getIopSuccOrFail(coinAddress) == 1) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.add(1);
                        } else {
                            if (voet_p_weight[msg.sender].weight > 1) {
                                voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.sub(1);
                            }
                        }
                        votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled = true;
                    } else if (getIopSuccOrFail(coinAddress) == 2) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.sub(1);
                        } else {
                            if (voet_p_weight[msg.sender].weight > 1) {
                                voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.sub(1);
                            }
                        }
                        votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled = true;
                    }
                }
            }
        }
        uint256 voteVeDao = votePeople[msg.sender][coinAddress].veDao;
        uint256 timestamp = votecoin[coinAddress].timestamp == 0 ? block.timestamp : votecoin[coinAddress].timestamp;
        vcoinInfo memory newvcoinInfo = vcoinInfo({
            timestamp: timestamp,
            bCLose: votecoin[coinAddress].bCLose,
            cpassingRate: votecoin[coinAddress].cpassingRate,
            cvotingRatio: votecoin[coinAddress].cvotingRatio,
            pass: votecoin[coinAddress].pass,
            deny: votecoin[coinAddress].deny,
            voteVeDao: votecoin[coinAddress].voteVeDao.add(voteVeDao),
            bEnd: votecoin[coinAddress].bEnd,
            bSuccessOrFail: votecoin[coinAddress].bSuccessOrFail,
            daoVoteIncome: votecoin[coinAddress].daoVoteIncome
        });
        votecoin[coinAddress] = newvcoinInfo;

        require(votecoin[coinAddress].timestamp.add(voteTime) >= block.timestamp, "expired."); //过期不允许投

        uint256 weight = voet_p_weight[msg.sender].weight;

        if (bStatus) {
            votecoin[coinAddress].pass = votecoin[coinAddress].pass.add(voteVeDao.mul(weight).div(10));
        } else {
            votecoin[coinAddress].deny = votecoin[coinAddress].deny.add(voteVeDao.mul(weight).div(10));
        }
        totalStaking = daoMintingPool.getcalculatestakingAmount();

        votecoin[coinAddress].cpassingRate = votecoin[coinAddress].pass.mul(100).div(
            votecoin[coinAddress].pass.add(votecoin[coinAddress].deny)
        );
        votecoin[coinAddress].cvotingRatio = votecoin[coinAddress].voteVeDao.mul(100).div(totalStaking);

        emit Vote(msg.sender, coinAddress, bStatus);
        return true;
    }

    //管理员设定否票结束
    function setVoteCoinEnd(address coinAddress) public onlyISMPolicy returns (bool) {
        require(votecoin[coinAddress].bCLose == false, "vote have not end.");
        votecoin[coinAddress].bCLose = true;
        votecoin[coinAddress].bEnd = true;
        if (votecoin[coinAddress].cpassingRate >= passingRate && votecoin[coinAddress].cvotingRatio >= votingRatio) {
            votecoin[coinAddress].bSuccessOrFail = true;
        } else {
            require(votecoin[coinAddress].timestamp.add(voteTime) <= block.timestamp); //只能允许过期
            votecoin[coinAddress].bSuccessOrFail = false;
        }
        emit SetVoteCoinEnd(msg.sender, coinAddress);
        return true;
    }

    // 获取投票是否结束
    function getVoteEnd(address coinAddress) public view returns (bool) {
        require(coinAddress != address(0), "coinAddress can not be zero address. ");
        return votecoin[coinAddress].bEnd;
    }

    //获取投票状态
    function getVoteStatus(address coinAddress) public view returns (bool) {
        require(coinAddress != address(0), "coinAddress can not be zero address. ");
        require(votecoin[coinAddress].bEnd, "vote status must be end.");
        return votecoin[coinAddress].bSuccessOrFail;
    }

    //管理员设定投票分配收益
    function setDaoVoteIncome(address coinAddress, uint256 amount)
        public
        payable
        onlyISMPolicy
        returns (address, uint256)
    {
        require(coinAddress != address(0), "coinAddress can not be zero address. ");
        require(votecoin[coinAddress].timestamp != 0, "time can not be zero.");
        require(amount > 0, "amount must be greater than zero.");
        votecoin[coinAddress].daoVoteIncome = amount;
        DAOToken.safeTransferFrom(msg.sender, address(this), amount);
        emit SetDaoVoteIncome(msg.sender, coinAddress, amount);
        return (coinAddress, amount);
    }

    //查看用户投票收益，
    function viewDaoVoteIncome(address coinAddress) public view returns (uint256) {
        require(coinAddress != address(0), "coinAddress can not be zero address. ");
        require(votecoin[coinAddress].timestamp != 0, "time can not be zero.");
        require(votePeople[msg.sender][coinAddress].timestamp != 0, "time can not be zero.");
        require(votecoin[coinAddress].bEnd, "vote status must be end."); //该币已经投票结束
        if (votePeople[msg.sender][coinAddress].withdrawIncome) {
            return 0;
        }
        uint256 weight = voet_p_weight[msg.sender].weight;
        //预估weight
        for (uint256 i = 0; i < vote_p_list[msg.sender].length; i++) {
            //已经结束的票
            if (votecoin[vote_p_list[msg.sender][i]].bEnd) {
                //如果没有统计过权重的，开始统计用户权重
                if (votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled == false) {
                    if (getIopSuccOrFail(coinAddress) == 1) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            weight = weight.add(1);
                        } else {
                            if (weight > 1) {
                                weight = weight.sub(1);
                            }
                        }
                    } else if (getIopSuccOrFail(coinAddress) == 2) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            weight = weight.sub(1);
                        } else {
                            if (weight > 1) {
                                weight = weight.sub(1);
                            }
                        }
                    }
                }
            }
        }
        //开始计算收益
        uint256 peopleVoteIncome = votePeople[msg.sender][coinAddress].veDao.mul(weight);
        peopleVoteIncome = peopleVoteIncome.mul(votecoin[coinAddress].daoVoteIncome).div(10);
        if (votePeople[msg.sender][coinAddress].bStatus) {
            peopleVoteIncome = peopleVoteIncome.div(votecoin[coinAddress].pass);
        } else {
            peopleVoteIncome = peopleVoteIncome.div(votecoin[coinAddress].deny);
        }
        return peopleVoteIncome;
    }

    //提取用户投票收益
    function tokeoutVoteIncome(address coinAddress) public returns (uint256) {
        require(coinAddress != address(0), "coinAddress can not be zero address. ");
        require(votecoin[coinAddress].timestamp != 0, "time can not be zero.");
        require(votePeople[msg.sender][coinAddress].timestamp != 0, "time can not be zero.");
        require(votecoin[coinAddress].bEnd, "vote status must be end."); //该币已经投票结束
        require(votePeople[msg.sender][coinAddress].withdrawIncome == false, "withdrawIncome's status must be false.");
        //更新weight
        for (uint256 i = 0; i < vote_p_list[msg.sender].length; i++) {
            //已经结束的票
            if (votecoin[vote_p_list[msg.sender][i]].bEnd) {
                //如果没有统计过权重的，开始统计用户权重
                if (votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled == false) {
                    if (getIopSuccOrFail(coinAddress) == 1) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.add(1);
                        } else {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.sub(1);
                        }
                        votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled = true;
                    } else if (getIopSuccOrFail(coinAddress) == 2) {
                        if (votecoin[vote_p_list[msg.sender][i]].bSuccessOrFail) {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.sub(1);
                        } else {
                            voet_p_weight[msg.sender].weight = voet_p_weight[msg.sender].weight.add(1);
                        }
                        votePeople[msg.sender][vote_p_list[msg.sender][i]].weightSettled = true;
                    }
                }
            }
        }

        //开始计算收益
        uint256 peopleVoteIncome = votePeople[msg.sender][coinAddress].veDao.mul(voet_p_weight[msg.sender].weight);
        peopleVoteIncome = peopleVoteIncome.mul(votecoin[coinAddress].daoVoteIncome).div(10);
        if (votePeople[msg.sender][coinAddress].bStatus) {
            peopleVoteIncome = peopleVoteIncome.div(votecoin[coinAddress].pass);
        } else {
            peopleVoteIncome = peopleVoteIncome.div(votecoin[coinAddress].deny);
        }
        votePeople[msg.sender][coinAddress].withdrawIncome = true;
        //提取用户投票收益
        IERC20(DAOToken).safeTransfer(msg.sender, peopleVoteIncome);
        emit TokeoutVoteIncome(msg.sender, peopleVoteIncome);
        return peopleVoteIncome;
    }
}
