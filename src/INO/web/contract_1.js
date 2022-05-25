
    let web3;
 
    const INOCOIN ="0xB7Dbf6F5cE417692b004D225728B108B6142a202"
 
    const DAO="0xDDd4A9D50a43B426F59F371B79975fE0e86e7D68"

    const miniDecimals = 1000000000000000000;
    const ethDecimals = 1000000000000000000;

    window.onload = function () {
        console.log(INOabi)
        console.log(ERC721ABI)
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
    async function getstatus(){
        getDaobalance()
        getowneraddr()
         showApplyCoin()
         getBlockNumber()
          
 
       // showAllIeoCoinInfo()
        checkInoApprove()  

        isApprovedForAll();
        showNFTList();
        showSellCoin();
        // getdaoAddress()
        
        
    }
    function initWeb3() {
        try {
            web3 = window.web3
            window.ethereum.enable()
            web3 = new Web3(web3.currentProvider)
      
            // this.MiniContract = new web3.eth.Contract(erc20miniAbi, MINI)
            return true
        } catch (e) {
            console.log(e.message)
            return false
        }
    }
    //管理员地址
    async function getowneraddr(){
        const contract = await getErc20Contract(INOabi,INOCOIN);
        let owner_addr = await contract.methods.owner(  ).call()
        $('.owner-addr').html(`${owner_addr }`); 
    } 
    // 通用ERC20Abi
    async function getErc20Contract (abi,contractAddr) {
        try {
           const _contract = new web3.eth.Contract(abi, contractAddr)
            return  _contract;
        } catch (e) {
            console.log('get contract error: ', e)
        }
    }
    // 获取用户地址
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
    //获取blocknumber
    async function getBlockNumber(){
        if(initWeb3()){
          const num = await  web3.eth.getBlockNumber();
          //const times = await we3.eth.getblockTi
          $('.block-number').html(`${num}`)  
                  
        }
    }
    async function getDaobalance(){
        const contract = await getErc20Contract(erc20miniAbi,DAO);
        let balance = await contract.methods.balanceOf(  INOCOIN ).call()
        balance = web3.utils.fromWei(balance,"ether")

        $('.token-balance').html(`${balance}`) 
    }
 
    let IeoCoinNo
 
    function inoCoinInfo({timestamp,coinAddress,tokenId,coinType,
       makeCoinAmount,openTime,expireTime,bSell,bBack,createUserAddress}){
       Object.assign(this,arguments[0])
    }
 
    async function pushInoCoin(){
       
        let makeCoinAmount = web3.utils.toWei('10', 'ether')
        const coinbase = await getCurrentAccount()
        const coinAddress = document.getElementById("ino-address").value
        const tokenId = document.getElementById("ino-tokenId").value
        IeoCoinNo = coinAddress
        let inoCoin =   new inoCoinInfo({
            timestamp:              '1649820308',
            coinAddress:            coinAddress,
            tokenId:                tokenId,
            coinType:               2,                      //1:ETH  2:DAO  3:USDT 
            makeCoinAmount:         makeCoinAmount,
            openTime:               '1649820308',
            expireTime:             '1660361108',
            bSell:                  false,
            bBack:                  false,
            createUserAddress:      coinbase
        })             
        console.log(inoCoin)      
        const contract = await getErc20Contract(INOabi,INOCOIN)   
        var ids = new Array
        ids[0] = tokenId
        return await contract.methods.createINOCoin(inoCoin,ids).send({from:coinbase})
    }
    async function checkInoApprove(){
        const account = await getCurrentAccount();
        const ino_addr = document.getElementById("ino-address").value
        const ino_tokenId = document.getElementById("ino-tokenId").value
        const contract = await getErc20Contract(ERC721ABI,ino_addr)

        const approve_addr = await contract.methods.getApproved(ino_tokenId).call()

        if(approve_addr ==  INOCOIN){
                console.log("授权")
                $('.IEO-isApprove').html(`授权`); 
            }else{
                console.log("未授权")
                $('.IEO-isApprove').html(`未授权`);

            }
    }
    async function isApprovedForAll(){
        const ino_addr = document.getElementById("ino-address").value
        const contract = await getErc20Contract(ERC721ABI,ino_addr)
        const coinbase = await getCurrentAccount();

        const bApprovedForAll = await contract.methods.isApprovedForAll(coinbase,INOCOIN).call()
        console.log("bApprovedForAll",bApprovedForAll)

    }
    //授权
    async function approveInoToken () {

        const ino_addr = document.getElementById("ino-address").value
        const ino_tokenId = document.getElementById("ino-tokenId").value
        const spenderAddr = INOCOIN 
        const coinbase = await getCurrentAccount()
        const contract =await getErc20Contract(ERC721ABI,ino_addr);
        console.log("spenderAddr  " , spenderAddr )
        return await contract.methods.approve(spenderAddr, ino_tokenId).send({ from: this.coinbase })
    }
    //授权全部币可以操作
    async function setApprovalForAll(){
        const spenderAddr = INOCOIN 
        const ino_addr = document.getElementById("ino-address").value
        const contract =await getErc20Contract(ERC721ABI,ino_addr);
        return await contract.methods.setApprovalForAll(spenderAddr, true).send({ from: this.coinbase })
    }
    async function getpair(collectType,symbol){
        if(collectType ==1 ){
            return "ETH/" + symbol
        }
        else if( collectType == 2 ){
            return "USDT/" + symbol
        }else{
            return "MINI/"+symbol
        }

    }
    async function getbPartner(bPartner,partnerNumber){
        if(bPartner){
            return "全部"
        }
        else{
            return partnerNumber     
        }
    }

    async function showNFTList(){
        const coinbase = await getCurrentAccount()
        const contract =await getErc20Contract(INOabi,INOCOIN);
        const ino_addr = document.getElementById("ino-address").value
        const NFTListlenght = await contract.methods.getNFTListlenght(ino_addr).call()
        let str ="上架的INO列表:<br>"
        for(let i=0;i<NFTListlenght;i++){
            let tokenId = await contract.methods.getNFTListData(ino_addr,i).call()

            let inoCoin = await contract.methods.getinoCoin(ino_addr,tokenId).call()

            console.log("inoCoin",inoCoin)
            const applyCoinAddr = await contract.methods.getapplyCoinAddress(inoCoin.coinType).call()

            str = str + "addr:" + ino_addr + "<br>"
            str = str + "tokenId: # " + tokenId + "<br>"
            str = str + "bsell: # " + inoCoin.bSell + "<br>"
            str = str + "支付币地址: " + applyCoinAddr + "<br><br>"
            str = str +"<button onclick=approveApplyToken()>授权支付币给合约</button>&nbsp;&nbsp;&nbsp;" 
            str = str +"<button onclick=BuyNftToken('"+ ino_addr +"',"+ tokenId +","+ inoCoin.coinTyp +")>购买/盲盒 token# "+ tokenId +"</button><br><br><hr>" 
            console.log(str)
        }
        $('.Ino-coinlist').html(`${str}`);
    }
    //授权支付币给合约
    async function approveApplyToken () {

        const spenderAddr = INOCOIN 
        const coinbase = await getCurrentAccount()
        const contract =await getErc20Contract(erc20miniAbi,DAO);
        console.log("spenderAddr  " , spenderAddr )
        const approveValue = web3.utils.toWei('100000000', 'ether')
        console.log("spenderAddr  " , spenderAddr )
        return await contract.methods.approve(spenderAddr, approveValue).send({ from: this.coinbase })
    }
    //购买币
    async function BuyNftToken(coinAddress ,tokenId,coinType){
        const coinbase = await getCurrentAccount()
        const contract = await getErc20Contract(INOabi,INOCOIN);
        let inoCoin = await contract.methods.getinoCoin(coinAddress,tokenId).call()
        let makeCoinAmount = web3.utils.fromWei(inoCoin.makeCoinAmount, "ether")
        if( coinType  == 1 ){
           return await contract.methods.buyNftToken(coinAddress,tokenId).send({from:coinbase,value:makeCoinAmount})
        }else{
            return await contract.methods.buyNftToken(coinAddress,tokenId).send({from:coinbase}) 
        }
    }
    /**
     * 
     * 管理员操作
     */
    //显示支付币信息
    async function showApplyCoin(){
        //apply-coin
        const coinbase = await getCurrentAccount()
        const contract = await getErc20Contract(INOabi,INOCOIN);
        const coinNumner = await contract.methods.getapplyCoinListLenght().call()
        let applyCoin_str="<br>"; 
        let str = "<br>"
        for(let i =0;i<coinNumner;i++){
            let index = await contract.methods.getapplyCoinListData(i).call()
            let coinAddress = await contract.methods.getapplyCoinAddress(index).call();
            let applyCoin = await contract.methods.getapplyCoin(coinAddress).call()
            applyCoin_str = applyCoin_str + "地址："+ applyCoin.contractAddress + "<br>名称："+ applyCoin.symbol + "<br>精度："+ applyCoin.decimals + "<br>"
            console.log(applyCoin)
         

        }
        $('.apply-coin').html(`${applyCoin_str}`); 
    }
    //获取支付币信息
    async function geterc20infoApply(){
        const coinAddress = document.getElementById("coin-address").value
        const contract = await getErc20Contract(erc20miniAbi,coinAddress)
        const symbol = await contract.methods.symbol().call();
        const decimals = await contract.methods.decimals().call();
        document.getElementById("coin-symbol").value = symbol
        document.getElementById("coin-decimals").value = decimals
    }
    //新增支付币
    async function addapplyCoin(){
        const contractAddress = document.getElementById("coin-address").value
        const symbol = document.getElementById("coin-symbol").value
        const decimals = document.getElementById("coin-decimals").value
        const coinbase = await getCurrentAccount()
        const contract = await getErc20Contract(INOabi,INOCOIN);
        return await contract.methods.addapplyCoin(contractAddress,symbol,decimals).send({from:coinbase})
    }
    //获取合约地址
    async function getthisContract(){
        
        const coinbase = await getCurrentAccount()
        const contract = await getErc20Contract(INOabi,INOCOIN);
        const thisContract = await contract.methods.thisContract().call()
        document.getElementById("coin-thisContract").value = thisContract
    }
    //显示支付币信息
    async function showSellCoin(){
        //apply-coin
        const coinbase = await getCurrentAccount()
        const contract = await getErc20Contract(INOabi,INOCOIN);
        const coinNumner = await contract.methods.getapplyCoinListLenght().call()
        let str = "<br>"
        for(let i =0;i<coinNumner;i++){
            let index = await contract.methods.getapplyCoinListData(i).call()
            let coinAddress = await contract.methods.getapplyCoinAddress(index).call();

            // let applyCoin = await contract.methods.getapplyCoin(coinAddress).call()
            // applyCoin_str = applyCoin_str + "地址："+ applyCoin.contractAddress + "<br>名称："+ applyCoin.symbol + "<br>精度："+ applyCoin.decimals + "<br>"
            str = str + "支付币地址：" + coinAddress + "<br>"

            let fee = await contract.methods.getSellCoin(coinbase,index).call();
            str = str + "余额：" + web3.utils.fromWei(fee,"ether") + "<br>"
            str = str +"<button onclick=withdraw("+ i +")>提取</button><br>" 
            console.log(str)

        }
        $('.SellCoin-amount').html(`${str}`); 
    }
 
    //获取ERC721信息
    async function getERC721Info(){
        const coinbase = await getCurrentAccount()
        const erc721Addr = document.getElementById("ino-address").value
        const tokenId = document.getElementById("ino-tokenId").value
        const contract = await getErc20Contract(ERC721ABI,erc721Addr);
        const getaddr = await contract.methods.ownerOf(tokenId).call()
        if( getaddr.toLocaleUpperCase() == coinbase.toLocaleUpperCase() ){
            const str = "find."
            $('.ino-erc721').html(`${str}`)  
            //ino-erc721
        }
        else{
             const  st= "no find."
            $('.ino-erc721').html(`${st}`)  
        }
    }
 
  