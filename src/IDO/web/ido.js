const IDOABI =[
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "time",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "newCoinAddress",
                "type": "address"
            }
        ],
        "name": "CreateIeoCoin",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "applyAddress",
                "type": "address"
            }
        ],
        "name": "IPOSUBscription",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "ISMPolicy",
                "type": "address"
            }
        ],
        "name": "LogISMPolicyUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferInitiated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "contract IERC20",
                "name": "COIN",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "takeBalance",
                "type": "uint256"
            }
        ],
        "name": "Settleaccounts",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "idoAmount",
                "type": "uint256"
            }
        ],
        "name": "ShutdownIpo",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "collectType",
                "type": "uint256"
            }
        ],
        "name": "TakeOut",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "who",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "planCon",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Withdraw",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "contractAddress",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "decimals",
                "type": "uint256"
            }
        ],
        "name": "addapplyCoin",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "coinAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "decimals",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "collectType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "idoAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "bBuyLimit",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "uBuyLimitNumber",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "bPartner",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "partnerNumber",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "bDAO",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "uDAONumber",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "startTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expireTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "bundle",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxbundle",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "planId",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct idoCoinContract.idoCoinInfoHead",
                "name": "idoCoinHead",
                "type": "tuple"
            }
        ],
        "name": "createIeoCoin",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "initializeOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "IPOsubscription",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_businessAddrAmount",
                "type": "uint256"
            }
        ],
        "name": "sendbusinessAddrAmount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_statAddrAmount",
                "type": "uint256"
            }
        ],
        "name": "sendstatAddrAmount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_treasuryAddrAmount",
                "type": "uint256"
            }
        ],
        "name": "sendtreasuryAddrAmount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "contract IDAOMintingPool",
                "name": "_daoMintingPool",
                "type": "address"
            }
        ],
        "name": "setdaoMintingPool",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_deductAmount",
                "type": "uint256"
            }
        ],
        "name": "setdeductAmount",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "contract IidovoteContract",
                "name": "_idovoteContract",
                "type": "address"
            }
        ],
        "name": "setidovoteContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_ipoTime",
                "type": "uint256"
            }
        ],
        "name": "setipoTime",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "ISMPolicy_",
                "type": "address"
            }
        ],
        "name": "setISMPolicy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "planId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "content",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "num",
                "type": "uint256"
            }
        ],
        "name": "setPlan",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_registerAmount",
                "type": "uint256"
            }
        ],
        "name": "setregisterAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            }
        ],
        "name": "setStartTime",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "setTakeOut",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "winningRate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "makeCoinAmount",
                "type": "uint256"
            }
        ],
        "name": "settleaccounts",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "settlement",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "shutdownIpo",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "takeOut",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "toSwapBuyDAO",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "withdraw",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_DAOToken",
                "type": "address"
            },
            {
                "internalType": "contract IDAOMintingPool",
                "name": "_IDAOMintingPool",
                "type": "address"
            },
            {
                "internalType": "contract IidovoteContract",
                "name": "_IidovoteContract",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "router_",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "_owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "businessAddrAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "COIN",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "daoAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "daoMintingPool",
        "outputs": [
            {
                "internalType": "contract IDAOMintingPool",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DAOToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "factory",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "getAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "contractAddress",
                "type": "address"
            }
        ],
        "name": "getapplyCoin",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "contractAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "decimals",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct idoCoinContract.applyCoinInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "coinid",
                "type": "uint256"
            }
        ],
        "name": "getapplyCoinAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getapplyCoinListData",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getapplyCoinListLenght",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getdaoMintingPool",
        "outputs": [
            {
                "internalType": "contract IDAOMintingPool",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getdeductAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "getidoCoin",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "internalType": "address",
                                "name": "coinAddress",
                                "type": "address"
                            },
                            {
                                "internalType": "string",
                                "name": "symbol",
                                "type": "string"
                            },
                            {
                                "internalType": "uint256",
                                "name": "decimals",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "collectType",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "idoAmount",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "bBuyLimit",
                                "type": "bool"
                            },
                            {
                                "internalType": "uint256",
                                "name": "uBuyLimitNumber",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "bPartner",
                                "type": "bool"
                            },
                            {
                                "internalType": "uint256",
                                "name": "partnerNumber",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "bDAO",
                                "type": "bool"
                            },
                            {
                                "internalType": "uint256",
                                "name": "uDAONumber",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "startTime",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "expireTime",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "bundle",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "maxbundle",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "planId",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct idoCoinContract.idoCoinInfoHead",
                        "name": "idoCoinHead",
                        "type": "tuple"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "coinAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "idoAmountTotal",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "registerAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "collectAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "withdrawAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "allCollectAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "ipoCollectAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "idoAmountComplete",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "ipoAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "bTakeOut",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "takeOutNumber",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "createUserAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "ipoRate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "bshutdown",
                        "type": "bool"
                    }
                ],
                "internalType": "struct idoCoinContract.idoCoinInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getidovoteContract",
        "outputs": [
            {
                "internalType": "contract IidovoteContract",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "getIpoRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "planId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "getPlan",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getplanListdata",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getplanListlength",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "planId",
                "type": "uint256"
            }
        ],
        "name": "getPlanNumber",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getregisterAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "coinAddress",
                "type": "address"
            }
        ],
        "name": "getUserInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "coinAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "makeCoinAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "takeCoinAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "userAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "takeOutNumber",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "planId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "settle",
                        "type": "bool"
                    }
                ],
                "internalType": "struct idoCoinContract.userInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "idovoteContract",
        "outputs": [
            {
                "internalType": "contract IidovoteContract",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ISMPolicy",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mintingAddrAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "priceDecimals",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "registeFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "registerAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "router",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "statAddrAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "treasuryAddrAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "zeorAddrAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]