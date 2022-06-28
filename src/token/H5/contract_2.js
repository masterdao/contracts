 
let web3;
const DAO = "0x74d6A01b882A03dAe08E36d3aD0BF779dAffc4BC"
const OWNER = "0x4Cf2EE6f44C53931b52bdbce3A15F123bf073162"

window.onload = function () {
    console.log(MULTISIG)
    initWeb3()

    init()
}
function init(){
    setTimeout(async () => {
        if (initWeb3()) {
            getstatus();

        }
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
    getDAOBalance();
    getowneraddr();
    getmultiAddresslist();
    getmultiNumber();//获取多签数量
    getcurrency_period();

 
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
//获取DAO余额
async function getDAOBalance(){
     
    const contract = await getErc20Contract(MULTISIG,DAO);
    let balance = await contract.methods.balanceOf(  OWNER ).call()
    
    balance = web3.utils.fromWei(balance,'ether')
    $('.dao-balance').html(`${balance }`); 

    const decimals = await contract.methods.decimals().call();
    $('.dao-decimals').html(`${decimals }`); 

    const symbol = await contract.methods.symbol().call();
    $('.dao-symbol').html(`${symbol }`); 

} 
//获取管理员地址
 
async function getowneraddr(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    let owner_addr = await contract.methods.owner(  ).call()
    $('.owner-addr').html(`${owner_addr }`); 
} 
//设定多签地址
async function set_multiAddress(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    const coinbase = await getCurrentAccount()
    const multi_add = document.getElementById("set-addr").value
    return contract.methods.setmultiAddress(multi_add).send({from:coinbase})
}
//获取多签地址列表
async function getmultiAddresslist(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    
    let list_len = await contract.methods.getmultiAddresslength( ).call()
    console.log(list_len)

    let str="<br>";
    for(let i =0 ;i< list_len;i++){
        let addr = await contract.methods.getmultiAddressinfo(i).call();
        str = str +"addrsss:"+ addr +"<br>"
    }
    $('.addr-list').html(`${str }`); 
}
//获取多签数量
async function getmultiNumber(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    document.getElementById("set-number").value = await contract.methods.getmultiNumber().call()

}
//设定多签数量
async function setmultiNumber(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    const coinbase = await getCurrentAccount()
    const set_number = document.getElementById("set-number").value
    return contract.methods.setmultiNumber(set_number).send({from:coinbase})
}
//获取当前届数
async function getcurrency_period(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    const period = await contract.methods.period().call()
    let issueAmount = await contract.methods.issuedAmount(period).call();
    issueAmount = web3.utils.fromWei(issueAmount,'ether')
    console.log("issueAmount " +  issueAmount)
    document.getElementById("set-amount").value = issueAmount 
    $('.currency-period').html(`${ period }`); 
}
//开启多签
async function startmultisignatureperiod(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    const coinbase = await getCurrentAccount()
    return contract.methods.startmultisignatureperiod().send({from:coinbase})
}
//发行
async function mint(){
    const contract = await getErc20Contract(MULTISIG,DAO);
    const coinbase = await getCurrentAccount()
    const set_amount = document.getElementById("set-amount").value
    return contract.methods.mint(set_amount).send({from:coinbase})
}

 