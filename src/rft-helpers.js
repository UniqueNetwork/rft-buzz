/**
 * Unique script for RFT event to be included in the browser
 * 
 */

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { web3Accounts, web3Enable, web3FromAddress } = require('@polkadot/extension-dapp');
const { stringToHex, hexToU8a, isHex } = require('@polkadot/util');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');

var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 12, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.' });

const ss58prefix = 255;

class RFTHelpers {

  setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  }

  getCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
  }

  async isSignerConnected() {
    const signer = this.getCookie("signer");
    if (signer) {
      console.log("Signer already connected:", signer);
      if (signer == "polkadot") await this.connectPolkadot();
      else await this.connectMetamask();
      return true;
    }
    return false;
  }

  async checkPolkadotExtension() {
    await web3Enable('uniquerftevent');
    const allAccounts = await web3Accounts({ ss58Format: ss58prefix });

    if (allAccounts.length == 0) return false;
    else return true;
  }

  async checkMetamask() {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }    
    return false;
  }

  async connectPolkadot() {
    await this.checkPolkadotExtension();
    let accObj = await web3Accounts({ ss58Format: ss58prefix });
    this.accounts = [];
    for (let i=0; i<accObj.length; i++) {
      console.log(accObj[i]);
      this.accounts.push({address: accObj[i].address, name: accObj[i].meta.name});
    }
    this.setCookie("signer", "polkadot", 365);
  }

  getEthAccounts() {
    return new Promise(async (resolve, reject) => {
      try {
        window.ethereum.request({method: 'eth_requestAccounts'})
          .then((accounts) => { resolve(accounts); } );
      } catch (e) {
        console.log('Error: ' + e.toString(), "ERROR");
        reject(e);
      }
    });
  }

  async connectMetamask() {
    try {
      const accObj = await this.getEthAccounts(); 
      this.accounts = [];
      for (let i=0; i<accObj.length; i++) {
        this.accounts.push({address: accObj[i], name: ""});
      }
      this.setCookie("signer", "metamask", 365);
    }
    catch (e) {
      console.log("User declined access to Metamask", e);
    }
    //[window.ethereum.selectedAddress];
  }

  getAccounts() {
    return this.accounts;
  }

  async connectSubstrate(wsEndpoint) {
    if (!this.api) {
      // Initialise the provider to connect to the node
      console.log(`Connecting to ${wsEndpoint}`);
      const wsProvider = new WsProvider(wsEndpoint);
    
      // Create the API and wait until ready
      this.api = await ApiPromise.create({ provider: wsProvider });
    }
  }

  getTransactionStatus(events, status) {
    if (status.isReady) {
      return "NotReady";
    }
    if (status.isBroadcast) {
      return "NotReady";
    } 
    if (status.isInBlock || status.isFinalized) {
      if(events.filter(e => e.event.data.method === 'ExtrinsicFailed').length > 0) {
        return "Fail";
      }
      if(events.filter(e => e.event.data.method === 'ExtrinsicSuccess').length > 0) {
        return "Success";
      }
    }
  
    return "Fail";
  }
  
  sendTransactionAsync(api, sender, transaction) {
    return new Promise(async (resolve, reject) => {
      try {
        const injector = await web3FromAddress(sender);
        api.setSigner(injector.signer);

        let unsub = await transaction.signAndSend(sender, ({ events = [], status }) => {
          const transactionStatus = this.getTransactionStatus(events, status);
  
          if (transactionStatus === "Success") {
            console.log(`Transaction successful`);
            resolve(events);
            unsub();
          } else if (transactionStatus === "Fail") {
            console.log(`Something went wrong with transaction. Status: ${status}`);
            reject(events);
            unsub();
          }
        });
      } catch (e) {
        console.log('Error: ' + e.toString(), "ERROR");
        reject(e);
      }
    });
  }

  bnToFixed(amount, decimals) {
    const ksmexp = BigNumber(10).pow(decimals);
    const balance = new BigNumber(amount);
    return balance.div(ksmexp).toFixed();
  }

  async getRelayBalance(addr) {
    const api = this.relayApi;
    const acc = await api.query.system.account(addr);
    return this.bnToFixed(acc.data.free, this.relayDecimals);
  }

  isValidAddress(address) {
    try {
      encodeAddress(
        isHex(address)
          ? hexToU8a(address)
          : decodeAddress(address)
      );
  
      return true;
    } catch (error) {
      return false;
    }
  }

  async isAddressEligibleForVoting(address) {
    // Check eligibility
    const punks = (await this.api.query.nonfungible.accountBalance(1, {Substrate: address})).toNumber();
    const chels = (await this.api.query.nonfungible.accountBalance(2, {Substrate: address})).toNumber();
    const ambs = (await this.api.query.nonfungible.accountBalance(3, {Substrate: address})).toNumber();
    const qtzObj = await this.api.query.system.account(address);
    const qtzTotal = parseFloat(qtzObj.data.free)/1e18; // "free" means total (including frozen balance)
    console.log("Collection balances: ", punks, chels, ambs, qtzTotal);

    return (punks > 0) || (chels > 0) || (ambs > 0) || (qtzTotal > 500);
  }

  async signMessage(address, message) {
      const injector = await web3FromAddress(address);
      this.api.setSigner(injector.signer);

      const signRaw = injector?.signer?.signRaw;
      if (!!signRaw) {
          const { signature } = await signRaw({
              address: address,
              data: stringToHex(message),
              type: 'bytes'
          });
          return signature;
      }
  }

}

window.RFTHelpers = RFTHelpers;
