let web3;
const VeDao = "0x3E6e60B5b557CA8Ee7e9921E50D4ad50dFCe8Be2"

const miniDecimals = 1000000000000000000;
const ethDecimals = 1000000000000000000;

window.onload = function () {
    console.log(VeDaoAbi)
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

async function getstatus() {
    showLevelList();
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

//管理员地址
async function getVeDaoNftContract(abi, contractAddr) {
    try {
        const _contract = new web3.eth.Contract(abi, contractAddr)
        return _contract;
    } catch (e) {
        console.log('get contract error: ', e)
    }
}

// 获取用户地址
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



async function showLevelList() {
    const contract = await getVeDaoNftContract(VeDaoAbi, VeDao);
    const levelSize = await contract.methods.getLevelListLength().call()
    let str = "Nft-Level列表:<br>"
    for (let i = 0; i < levelSize; i++) {
        let level = await contract.methods.getLevel(i).call()
        console.log("level", level)
        str = str + "level:" + level + "<br>"
        console.log(str)
    }
    $('.nft-levelList').html(`${str}`);
}


/**
 *
 * 管理员操作
 */


//获取白名单信息
async function getAllowList() {
    const userAddress = document.getElementById("user-address").value
    const level = document.getElementById("user-level").value
    const contract = await getVeDaoNftContract(VeDaoAbi, VeDao);
    const allow = await contract.methods.getAllowList(userAddress, level).call();
    $('.coin-allow').html(`${allow}`);

}

//新增白名单
async function addAllowList() {
    const userAddress = document.getElementById("user-add-address").value
    const uri = document.getElementById("coin-add-uri").value
    const level = document.getElementById("coin-add-level").value
    const coinbase = await getCurrentAccount()
    const contract = await getVeDaoNftContract(VeDaoAbi, VeDao);
    return await contract.methods.addAllowList(userAddress, uri, level).send({from: coinbase})
}

//测试mint
async function mintAllowList() {
    const level = document.getElementById("coin-mint-level").value
    const coinbase = await getCurrentAccount()
    const contract = await getVeDaoNftContract(VeDaoAbi, VeDao);
    return await contract.methods.mintAllowList(level).send({from: coinbase})
}

 
  