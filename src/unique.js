const { ApiPromise, WsProvider } = require('@polkadot/api');
const config = require('./config');

class Unique {
    async connect() {
        if (!this.api) {
            // Initialize the provider to connect to the node
            const wsProvider = new WsProvider(config.wsEndpoint);
            
            // Create the API and wait until ready
            const defs = require('@unique-nft/unique-mainnet-types/definitions');
            this.api = await ApiPromise.create({ 
                provider: wsProvider,
                rpc: { unique: defs.unique.rpc }
            });
            await this.api.isReady;
            
            this.api.on('error', () => { 
                console.log("Polkadot API Error");
                process.exit(0);
            });
            this.api.on('disconnected', () => { 
                console.log("Polkadot API Disconnected");
                process.exit(0);
            });
        }
    }

    async isSubstrateAddressEligible(address) {
        await this.connect();

        // Does address have required balances?
        const punks = (await this.api.query.nonfungible.accountBalance(1, {Substrate: address})).toNumber();
        const chels = (await this.api.query.nonfungible.accountBalance(2, {Substrate: address})).toNumber();
        const ambs = (await this.api.query.nonfungible.accountBalance(3, {Substrate: address})).toNumber();
        const qtzObj = await this.api.query.system.account(address);
        const qtzTotal = parseFloat(qtzObj.data.free)/1e18; // "free" means total (including frozen balance)

        return (punks > 0) || (chels > 0) || (ambs > 0) || (qtzTotal >= 500);
    }
}

module.exports = {
    Unique
};