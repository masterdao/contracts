 
let web3;
var DAO="0x5e0289c130BcC61FBe5cEc5dce5fE775E50752bf"

var DAOPOOLCONTRACT ="0xD106450F5FDed8998a1E7928094C6fd6A9697B8F"

fetch('https://app.vedao.pro/v1/dao/public/contract-address')
    .then(resp => resp.json())
    .then(({data}) => {
        DAO = data.tokenAddress;
        DAOPOOLCONTRACT = data.poolAddress;
    })

window.onload = function () {
    console.log(DAOPOOLABI)
    initWeb3()

    init()
}
function init(){
    setTimeout(async () => {
            getstatus();
    },1000);
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
 
async function getstatus(){
    checkbonusApprove(DAO,'.bonus-isApprove');

    showmintingPoolType();//显示矿池类型
    getmonetaryPolicy();   //显示操作员
    showlistmintingPool();  //显示矿池信息
    getDaoBalance(); //获取DAO在矿池的余额
    getOwern();
    getBonusPool();   //获取奖金池信息 
     //getBonusToken()
     
    // getmintingPool()
     getMinerlist();
     getminerVeDao();

    getuserTotalVeDao();
 
}

// 通用ERC20Abi
async function getErc20Contract (abi,contractAddr) {
    try {
       const _contract = new web3.eth.Contract(abi, contractAddr)
       //web3.eth.net.givenProvider.chainId = 0x22b8 
       web3.eth.net.givenProvider.chainId = 0x03 
        return  _contract;
    } catch (e) {
        console.log('get contract error: ', e)
    }
}
// 获取用户地址
// async function getCurrentAccount () {
//     if(initWeb3()){
//         try {
//         //coinbase = window.web3.eth.accounts[0]
//         coinbase = await window.ethereum.request({method:'eth_accounts'})    
//         return this.coinbase[0];
//         } catch (e) {
//             console.log(e.message)
//         }
//     }

// }
async function getCurrentAccount() {
    try {
        if(window.web3.eth) {
            window.ethereum.request({method: 'eth_requestAccounts'})
            this.coinbase = window.web3.eth.accounts[0] || ''
        } else {
            const allAccounts = await window.ethereum.request({ method: 'eth_accounts' });
            this.coinbase = allAccounts[0]
        }
        return this.coinbase
    } catch (e) {
        console.log(e.message)
    }
}
//获取LSPX余额
async function getDaoBalance(){
     
    const contract = await getErc20Contract(erc20miniAbi,DAO);
    let balance = await contract.methods.balanceOf(  DAOPOOLCONTRACT ).call()
    balance = web3.utils.fromWei(balance,'ether')
    $('.dao-balance').html(`${balance }`); 
} 
 
async function checkbonusApprove(token,id){
    const account = await getCurrentAccount();
    const _isApprove = await isApprove(account,DAOPOOLCONTRACT,token)
     
    if(_isApprove > 0){
            console.log("已授权")
            $(id).html(`已授权`);
        }else{
            console.log("未授权")
            $(id).html(`未授权`);
        }
}
async function checktokenApprove(token){
    const account = await getCurrentAccount();
    const _isApprove = await isApprove(account,DAOPOOLCONTRACT,token)
     
    if(_isApprove > 0){
            alert("授权")
        }else{
            alert("未授权")
        } 
}
//检查授权
async  function isApprove (ownerAddr, spenderAddr,token) {
    //const contractAddress = document.getElementById("bonus-address").value
    //if( contractAddress == "" ) return 0
    const contract = await getErc20Contract(erc20miniAbi,token);
    const res = await contract.methods.allowance(ownerAddr, spenderAddr).call()
  
    return Number(res) > 0
}
async function approveBonusToken(){
    await  approveToken (DAO)
}
//授权
async function approveToken (token) {
    if( token != DAO ){
        checktokenApprove(token)
    }
    const contractAddress = token
    const spenderAddr = DAOPOOLCONTRACT 
    const coinbase = await getCurrentAccount()
   
    const contract =await getErc20Contract(erc20miniAbi,contractAddress);
    const approveValue = web3.utils.toWei('100000000', 'ether')
    console.log("spenderAddr  " , spenderAddr )
    return await contract.methods.approve(spenderAddr, approveValue).send({ from: this.coinbase })
}  

/** 管理员 */
async function getOwern(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    const Owern = await contract.methods.owner().call()
    console.log(Owern)
}
async function getmonetaryPolicy(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    const monetaryPolicy = await contract.methods.monetaryPolicy().call()
    console.log("monetaryPolicy",monetaryPolicy)
    document.getElementById("set-Policy").value = monetaryPolicy
}
async function addmintingPool(){
    const lptoken    = document.getElementById("create-lptoken-token").value
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    return await contract.methods.addmintingPool(lptoken).send({from:coinbase})
}
var lp_list = new Array();
var amount_list = new Array();
async function getmintingPool(){
 
    
}
async function addBonusToken(){
    const lpToken= document.getElementById("create-lptoken-token").value   //奖金币地址
    const amount = document.getElementById("create-bonus-amount").value    //奖金数量
    const lastTime = document.getElementById("last-time").value             //奖金发完时间
    const name = document.getElementById("create-lptoken-name").value
    const bonusaddress = DAO
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let bounsAmount = await web3.utils.toWei(amount,'ether');
    console.log(lpToken)
    console.log(bounsAmount)
    return await contract.methods.addBonusToken(name,lpToken,bounsAmount,lastTime).send({from:coinbase})
}
async function addBonusToken1(){
    const bonusaddress = document.getElementById("bonus-token").value
    const lptoken    = document.getElementById("lptoken-token").value
    const amount = document.getElementById("bonus-amount").value
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let bounsAmount = await web3.utils.toWei(amount,'ether');

    return await contract.methods.addBonusToken(bonusaddress,bounsAmount,lptoken).send({from:coinbase})
}
async function getBonusToken(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let poollen = await contract.methods.getlistmintingPool().call()
    console.log("poollen"+poollen)

    let str="";
    for(let i =0;i< poollen;i++){
        let Pooldata = await contract.methods.getlistmintingPooldata(i).call()
        console.log("Pooldata: "+Pooldata);

        let BonusTokenInfo = await contract.methods.getBonusToken(Pooldata.lpToken).call()
        console.log("BonusTokenInfo: "+BonusTokenInfo)
        let ids = "lp-isApprove" + i
        
        // let id = "lptoken"+i
        // str = str + "Minting pool:" + Pooldata.lpToken +"<br>"+
        //         "name:" + BonusTokenInfo.name +"<br>" +
        //         "totallpToken: " + web3.utils.fromWei(BonusTokenInfo.totallpToken)  + "<br>" +
        //         "totalBonus:   " + web3.utils.fromWei(BonusTokenInfo.totalBonus) + "<br>"+
        //         "lastBonus:    " + web3.utils.fromWei(BonusTokenInfo.lastBonus) + "<br>"+
        //         "accBonusPerShare:" + BonusTokenInfo.accBonusPerShare + "<br>"+
        //         "Timestamps:" + BonusTokenInfo.timestamps + "（矿池创建时间）<br>"+
        //         "expirationTimestamps:" + BonusTokenInfo.expirationTimestamps + "（到期时间）<br>"+
        //         "lastRewardTime:" + BonusTokenInfo.lastRewardTime + "<br>"+
        //         "ismPerBlock:" + web3.utils.fromWei(BonusTokenInfo.ismPerBlock) + "(每秒奖励)<br>" +
        //         "deposit amount：<input type='text' id='"+ id +"' value=100><br><br>" +
        //         "<button onclick=approveToken('"+ lpToken +"')>授权</button><br><br>"+
        //         "<button onclick=deposit('"+ lpToken +"','"+ i +"') > Deposit </button><hr>"
    }
    $('.showpoollist').html(`${str }`); 

    $('.minting-pool-list').html(`${ str }`); 
 
} 
async function getBonusPool(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let poollen = await contract.methods.getbonusListlenght().call()
    let str="<br>";
    for(let i =0;i< poollen;i++){
        let bsToken = await contract.methods.getbonusListAddr(i).call()
        let BonusTokenInfo = await contract.methods.getBonusToken(bsToken).call()
         console.log(BonusTokenInfo)
         str = str + "Minting pool:" + bsToken +"<br>"+
         "name:" + BonusTokenInfo.name +"<br>" +
         "totalBonus:   " + web3.utils.fromWei(BonusTokenInfo.totalBonus) + "<br>"+
         "lastBonus:    " + web3.utils.fromWei(BonusTokenInfo.lastBonus) + "<br>"+
         "accBonusPerShare:" + BonusTokenInfo.accBonusPerShare + "<br>"+
         "expirationTimestamps:" + BonusTokenInfo.expirationTimestamps + "<br>"+
         "lastRewardTime:" + BonusTokenInfo.lastRewardTime +"<br>"+
         "daoPerBlock:" + web3.utils.fromWei(BonusTokenInfo.daoPerBlock) + "<br><hr>"
    }
    $('.minting-pool-list').html(`${ str }`); 
}
 

var listAddr = new Array()

async function getMinerlist(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    const minerlistlen = await contract.methods.getminerPoolList(coinbase).call()
    let str =""
    let poolTypeId = 0; 
    for(let i =0;i< minerlistlen;i++){
        let minerlistlptoken = await contract.methods.getminerPoolListData(coinbase,i).call()
        let minerInfo = await contract.methods.getminerInfo(coinbase,minerlistlptoken.lpToken,poolTypeId).call()
        console.log("minerInfo: "+minerInfo)
        listAddr[i] = minerInfo.lpToken
        str = str + "矿池：" + minerInfo.lpToken + "<br>" +
                    "时间：" + minerInfo.timestamps + "<br>"+
                    "数量：" + web3.utils.fromWei(minerInfo.amount )  +"<br>"  +
                    "V额Dao:" +web3.utils.fromWei(minerInfo.veDao )  +"<br>"  +
                    "<button onclick=withdraw('"+ minerInfo.lpToken +"','"+ poolTypeId +"')>withdraw</button> &nbsp; "+
                    "<button onclick=viewMinting('"+ i +"','"+ minerInfo.lpToken +"')> viewMinting </button><hr>"  

    }
    $('.miner-list').html(`${str }`);
} 
async function withdraw(lpToken,poolTypeId){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    return contract.methods.withdraw(lpToken,poolTypeId).send({from:coinbase})
}
async function getminerVeDao(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT);
    let who = "0x005d73Fa417A83F334E21a5F0577e0Aa8d82Fb75"
    let lpToken = "0xDDd4A9D50a43B426F59F371B79975fE0e86e7D68"
    let poolTypeId = 0
    let coin = await contract.methods.getminerVeDao(who,lpToken,poolTypeId).call();
    console.log(coin)
}

async function viewMinting(index,lpToken){
    //const lpToken = listAddr[index]
    // const lpToken = "0x950824fba876d5dD67416C2d9338c7FeC24a1054"
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
  
    const poolTypeId = 0
    console.log("coinbase,lpToken,DAO,poolTypeId",coinbase,lpToken,DAO,poolTypeId)
    let bonus = await contract.methods.viewMinting(coinbase,lpToken,DAO,poolTypeId).call()
    const getcalculatestakingAmount = await contract.methods.getcalculatestakingAmount().call()

    console.log("getcalculatestakingAmount",getcalculatestakingAmount)
    console.log("bonus"+ bonus)

    bonus = web3.utils.fromWei(bonus,'ether')
    $('.show-bouns').html(`${bonus}`)
 }
async function getDAOReward(){
    const lpToken = "0x55B8529205Bdb3a2383Bf2d4580059222ACC4E0e"
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    let DAOReward = await contract.methods.getDAOReward(coinbase,lpToken).call()
    console.log(DAOReward)
}
async function setMonetaryPolicy(){
    const Monetary = document.getElementById("set-Policy").value
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    return contract.methods.setMonetaryPolicy(Monetary).send({from:coinbase})
}
async function getexpirationTimestamps(){
    const productAddress = document.getElementById("product-address").value
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const exptime = await contract.methods.getexpirationTimestampsAndName(productAddress).call()
    console.log(exptime[0],exptime[1])
    document.getElementById("create-lptoken-name").value = exptime[1]
    document.getElementById("last-time").value = exptime[0]
    document.getElementById("last-time").disabled = 'disabled'
    //$('.exptime').html(`${ exptime }`);
    //exptime
}
 
 
//矿池类型列表
async function showmintingPoolType(){
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let mintingPoolTypeSize =  await contract.methods.getmintingPoolTypeSize().call()
    let str = "";
    for(let i =0;i< mintingPoolTypeSize ;i++){
        let pool = await contract.methods.getmintingPoolType(i).call()
        str = str + 
                "poolID:" +pool.id + "<br>" +
                "bstatus:" + pool.bstatus + "<br>"+
                "poolLength:" + pool.poolLength + "<br>"+
                "weight:" + pool.weight + "<br><hr>"
        
    }
    $('.show-poolTypeinfo').html(`${ str }`);
}
//新增矿池类型
async function addmintingPoolType(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    const poolLength = document.getElementById("set-poolLength").value
    const weight = document.getElementById("set-weight").value
    return contract.methods.addmintingPoolType(poolLength,weight).send({from:coinbase})
}
//新增矿池
async function addmintingPool(){
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    const lpToken = document.getElementById("set-lpToken").value
    const multiple = document.getElementById("set-multiple").value
    const poolTypeId = document.getElementById("set-poolTypeId").value
    return contract.methods.addmintingPool(lpToken,multiple,poolTypeId).send({from:coinbase})
}
async function showlistmintingPool(){
    const coinbase = await getCurrentAccount()
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    let len =  await contract.methods.getlistmintingPool().call()
    let str = "";
    let token =""
    for(let i =0;i< len ;i++){
        let pool = await contract.methods.getlistmintingPooldata(i).call()
        let id = "lptoken"+i
        str = str + "矿池 "+ i  +" :<br>"+
                "poolTypeId:" +pool.poolTypeId + "<br>" +
                "lpToken:" + pool.lpToken + "<br>"+
                "multiple:" + pool.multiple + "<br>"+
                "lpTokensymbol:" + pool.lpTokensymbol + "<br><br>" +
                "deposit amount：<input type='text' id='"+ id +"' value=100><br><br>" +
                
                "<button onclick=approveToken('"+ pool.lpToken +"')>授权</button>&nbsp;&nbsp;"+
                "<button onclick=deposit('"+ pool.lpToken +"','"+ i +"','"+ pool.poolTypeId +"') > Deposit </button><hr>"
                token = pool.lpToken 
    }
    $('.show-poolinfo').html(`${ str }`);
    
}

async function  deposit(lpToken,index,poolTypeId){
    let id = "lptoken"+ index
    const amount = document.getElementById(id).value
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT) 
    const coinbase = await getCurrentAccount()
    let depositAmount = web3.utils.toWei(amount,'ether')
    console.log(lpToken,depositAmount,poolTypeId)
    
    return await contract.methods.deposit(lpToken,depositAmount,poolTypeId).send({from:coinbase})   
}

async function  getuserTotalVeDao(){
    const coinbase = await getCurrentAccount();
    const contract = await getErc20Contract(DAOPOOLABI,DAOPOOLCONTRACT)
    const vedao= await contract.methods.getuserTotalVeDao(coinbase).call()
    $('.show-vedao').html(`${ vedao }`);
}