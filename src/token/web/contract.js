let account
  let provider
  let signer
  const DAO = "0x5f37D4295eBeCf8f6092B58751df36b5b50145E8"
  const OWNER = "0x005d73Fa417A83F334E21a5F0577e0Aa8d82Fb75"
  window.onload = () => {
    initWeb3().then()
    init()

  }
  function init(){
    setTimeout(async () => {
            getstatus();
    },1000);
}

  async function initWeb3() {
      console.log(erc20Abi)
    if (window.ethereum) {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
        account = accounts[0]
        provider = await new ethers.providers.Web3Provider(window.ethereum)
    } else if (window.web3.currentProvider) {
        provider = await new ethers.providers.Web3Provider(window.web3.currentProvider)
    }
    signer = provider.getSigner(account).connectUnchecked()
  }

  async function getERC20Contract (contractAddress, abi = erc20Abi) {
    return new ethers.Contract(contractAddress, abi, signer)
  }
  async function getstatus(){
    getDAOBalance();
    //getowneraddr();
    getmultiAddresslist();
 
}
//获取DAO余额
async function getDAOBalance(){
     
    const contract = await getERC20Contract(DAO,erc20Abi);
    let balance = await contract.balanceOf(  OWNER )
    
    balance = ethers.utils.formatUnits(balance, 18)
    console.log(balance)

    $('.dao-balance').html(`${ balance }`); 

} 
  async function onTest() {
    // 随便用的bsc的usdt地址作为测试的
    const contract = await getERC20Contract(DAO,erc20Abi)
    console.log(contract)
    const total = await contract.totalSupply()
    console.log(total.toString())
    // 处理精度
    const balance = ethers.utils.formatUnits(total, 18)
    console.log(balance)
  }
//获取多签地址列表
async function getmultiAddresslist(){
    const contract = await getERC20Contract(DAO,MULTISIG);
    
    let list_len = await contract.getmultiAddresslength( )

    console.log(list_len)
    
    let str="<br>";
    for(let i =0 ;i< list_len;i++){
        let addr = await contract.getmultiAddressinfo(i) 
        str = str +"addrsss:"+ addr +"<br>"
    }
    $('.addr-list').html(`${str }`); 
}
 