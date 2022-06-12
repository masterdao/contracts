let web3;
const DAO = "0x5e0289c130BcC61FBe5cEc5dce5fE775E50752bf"
const OWNER = "0x4Cf2EE6f44C53931b52bdbce3A15F123bf073162"
const IDOVOTECONTRACT = "0x43f58155C25c76521499611486BE9fD605B33107"
const IDOCONTRACT = "0xCEaa012E72e1f5D3D2c03FE5BBC0d4600445300e"
const ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
let voteStauts;

window.onload = function () {
    console.log(IDOVOTE)
    console.log(erc20Abi)
    initWeb3()

    init()
}

function init() {
    setTimeout(async () => {
        if (initWeb3()) {
            getstatus();

        }
    }, 1000);
}

function initWeb3() {
    try {
        web3 = window.web3
        window.ethereum.enable()
        web3 = new Web3(web3.currentProvider)

        return true
    } catch (e) {
        console.log(e.message)
        return false
    }
}

async function getstatus() {
    getpassingRate()
    getvotingRatio()
    setStartBlockTime()


}

// 通用ERC20Abi
async function getErc20Contract(abi, contractAddr) {
    try {
        const _contract = new web3.eth.Contract(abi, contractAddr)
        //web3.eth.net.givenProvider.chainId = 0x22b8
        web3.eth.net.givenProvider.chainId = 0x03
        return _contract;
    } catch (e) {
        console.log('get contract error: ', e)
    }
}

async function getCurrentAccount() {
    try {
        if (window.web3.eth) {
            window.ethereum.request({method: 'eth_requestAccounts'})
            this.coinbase = window.web3.eth.accounts[0] || ''
        } else {
            const allAccounts = await window.ethereum.request({method: 'eth_accounts'});
            this.coinbase = allAccounts[0]
        }
        return this.coinbase
    } catch (e) {
        console.log(e.message)
    }
}

//获取通过率
async function getpassingRate() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const passingRate = await contract.methods.getpassingRate().call()
    document.getElementById("set-passingRate").value = passingRate
}

//设定通过率
async function setpassingRate() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const passingRate = document.getElementById("set-passingRate").value
    return await contract.methods.setpassingRate(passingRate).send({from: coinbase})
}

//获取投票率
async function getvotingRatio() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const votingRatio = await contract.methods.getvotingRatio().call()
    document.getElementById("set-votingRatio").value = votingRatio
}

//设定投票率
async function setvotingRatio() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const votingRatio = document.getElementById("set-votingRatio").value
    return await contract.methods.setvotingRatio(votingRatio).send({from: coinbase})
}

//获取投票分配收益

//设定投票分配收益
async function setDaoVoteIncome() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const DaoVoteIncome = document.getElementById("set-DaoVoteIncome").value
    let amount = document.getElementById("set-amount").value
    amount = web3.utils.toWei(amount, 'ether')
    return await contract.methods.setDaoVoteIncome(DaoVoteIncome, amount).send({from: coinbase})

}

// getvotecoin
async function getvotecoin() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const DaoVoteIncome = document.getElementById("set-DaoVoteIncome").value

    let coin = await contract.methods.getvotecoin(DaoVoteIncome).call();
    console.log(coin)
}

async function getminerVeDao() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    let who = "0x005d73Fa417A83F334E21a5F0577e0Aa8d82Fb75"
    let lpToken = "0xDDd4A9D50a43B426F59F371B79975fE0e86e7D68"
    let poolTypeId = 0
    let coin = await contract.methods.getminerVeDao(who, lpToken, poolTypeId).call();
    console.log(coin)
}

async function approveToken() {

    const contractAddress = DAO
    const spenderAddr = IDOVOTECONTRACT
    const coinbase = await getCurrentAccount()

    const contract = await getErc20Contract(erc20Abi, contractAddress);
    const approveValue = web3.utils.toWei('100000000', 'ether')
    console.log("spenderAddr  ", spenderAddr)
    return await contract.methods.approve(spenderAddr, approveValue).send({from: this.coinbase})
}

function getvotestatus(st) {
    if (st == 1) {
        voteStauts = true
    } else {
        voteStauts = false
    }
    console.log(voteStauts)
}

//投票
async function vote() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-coinAddress").value
    return await contract.methods.vote(coinAddress, true).send({from: coinbase})
}

async function setVoteTime() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const time = document.getElementById("set-time-coinAddress").value
    return await contract.methods.setVoteTime(time).send({from: coinbase})
}

//设定投票结束
async function setVoteCoinEnd() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-end-coinAddress").value
    return await contract.methods.setVoteCoinEnd(coinAddress).send({from: coinbase})
}

//查看用户投票收益，
async function viewDaoVoteIncome() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-dao-vote-income").value;
    const DaoVoteIncome = await contract.methods.viewDaoVoteIncome(coinAddress).call()
    console.log("DaoVoteIncome ", DaoVoteIncome)
    //vote-Income
    $('.vote-Income').html(`${DaoVoteIncome}`);
}

//提取用户投票收益
async function tokeoutVoteIncome() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount()
    return await contract.methods.tokeoutVoteIncome().send({from: coinbase})

}

async function setStartTime() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-start-coinAddress").value
    const time = document.getElementById("set-start-time").value
    return await contract.methods.setStartTime(coinAddress, time).send({from: coinbase})

}


async function setStartBlockTime() {
    const time = Math.floor(Date.now() / 1000);
    document.getElementById("set-start-time").value = time
    document.getElementById("set-coin-start-time").value = time;

}


async function setIpoTime() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const time = document.getElementById("set-ipo-time").value
    return await contract.methods.setipoTime(time).send({from: coinbase})

}

async function IPOsubscription() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-ipo-coinAddress").value
    const amount = document.getElementById("set-ipo-amount").value
    return await contract.methods.IPOsubscription(coinAddress, amount).send({from: coinbase})

}

async function settlement() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-settlement-coinAddress").value
    return await contract.methods.settlement(coinAddress).send({from: coinbase})
}

async function setTakeOut() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const coinAddress = document.getElementById("set-take-coinAddress").value
    return await contract.methods.setTakeOut(coinAddress).send({from: coinbase})
}

async function setPlan() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    const planId = document.getElementById("set-plan-id").value
    const content = document.getElementById("set-plan-content").value
    const num = document.getElementById("set-plan-num").value
    return await contract.methods.setPlan(planId, content, num).send({from: coinbase})
}

async function setUpCoin() {
    const contract = await getErc20Contract(IDOABI, IDOCONTRACT);
    const coinbase = await getCurrentAccount()
    //
    const coinAddress = document.getElementById("set-coin-coinAddress").value;
    const symbol = document.getElementById("set-symbol").value;
    const decimals = document.getElementById("set-decimals").value;
    const collectType = document.getElementById("set-collect-type").value;
    const idoAmount = document.getElementById("set-ido-amount").value;
    const price = document.getElementById("set-ido-price").value;
    const bBuyLimit = document.getElementById("set-buy-limit").value;
    const uBuyLimitNumber = document.getElementById("set-buy-number").value;
    const bPartner = document.getElementById("set-partner").value;
    const partnerNumber = document.getElementById("set-partner-number").value;
    const bDAO = document.getElementById("set-dao").value;
    const uDAONumber = document.getElementById("set-dao-number").value;
    const startTime = document.getElementById("set-coin-start-time").value;
    const expireTime = document.getElementById("set-coin-expire-time").value;
    const bundle = document.getElementById("set-bundle").value;
    const maxbundle = document.getElementById("set-max-bundle").value;
    const planId = document.getElementById("set-coin-plan-id").value;
    const idoCoinHead = [
        coinAddress,
        symbol,
        decimals,
        collectType,
        idoAmount,
        price,
        bBuyLimit,
        uBuyLimitNumber,
        bPartner,
        partnerNumber,
        bDAO,
        uDAONumber,
        // 秒
        startTime,
        expireTime,
        bundle,
        maxbundle,
        planId
    ];
    const newAddress = await contract.methods.createIeoCoin(idoCoinHead).send({from: coinbase})
    console.log("newAddress  ", newAddress)


    contract.events.CreateIeoCoin({
        filter: {},
        fromBlock: 'latest'
    }, function (error, event) {
    })
        .on('data', function (event) {
            console.log(event);
            $('.show-new-address').html(`${event}`);
        })
        .on('changed', function (event) {
            console.log('emove event from local database');
        })
        .on('error', console.error);


}

//授权
async function approveDAOToken() {
    const contractAddress = DAO
    const spenderAddr = IDOCONTRACT
    const contract = await getErc20Contract(erc20Abi, contractAddress);
    const approveValue = web3.utils.toWei('100000000', 'ether')
    console.log("spenderAddr  ", spenderAddr)
    return await contract.methods.approve(spenderAddr, approveValue).send({from: this.coinbase})

}

async function approveCoinToken() {
    const spenderAddr = IDOCONTRACT
    const coinAddress = document.getElementById("set-coin-coinAddress").value;
    const fudContract = await getErc20Contract(erc20Abi, coinAddress);
    const approveValue = web3.utils.toWei('100000000', 'ether')
    console.log("spenderAddr  ", spenderAddr)
    console.log("coinAddress  ", coinAddress)
    return await fudContract.methods.approve(spenderAddr, approveValue).send({from: this.coinbase})
}

async function getVoteEnd() {
    const contract = await getErc20Contract(IDOVOTE, IDOVOTECONTRACT);
    const coinbase = await getCurrentAccount();
    const coinAddress = document.getElementById("set-coinAddress").value;
    const vote = await contract.methods.getVoteEnd(coinAddress).call()
    $('.show-vote').html(`${vote}`);
}