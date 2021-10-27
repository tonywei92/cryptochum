const DappLib = require('./dapp-lib');

async function start(){
  try {
    // console.log(DappLib.getConfig())
    // console.log(await DappLib.getAccounts())
    console.log(await DappLib.provisionAccount({account: "0x3ebd50faa69303cd"}))  
  } catch (error) {
    console.log(error)
  }
  
}


start()