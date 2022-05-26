const { Keyring } = require('@polkadot/api');
const config = require('./config');
const Web3 = require('web3');

const { Client } = require('pg');

let dbClient = null;

class DBBase {

  async getDbConnection() {
    if (!dbClient) {
      dbClient = new Client({
        user: config.dbUser,
        host: config.dbHost,
        database: config.dbName,
        password: config.dbPassword,
        port: config.dbPort
      });
      dbClient.connect();
      dbClient.on('error', err => {
        console.log(`Postgres server error: ${err}`, logging.status.ERROR);
        process.exit();
      });
      console.log("Connected to the DB");
    }
    return dbClient;
  }

  ss58(address) {
    // Convert address to ss58 format
    const keyring = new Keyring();
    const publickey = keyring.decodeAddress(address);
    return keyring.encodeAddress(publickey, config.ss58prefix);
  }

  validateAddress(address) {
    let ret = '';
    try {
      ret = this.ss58(address);
    } catch (e) {}
    try {
      if (Web3.utils.isAddress(address))
        ret = address;
    } catch (e) {}
    if (ret.length > 0) return ret;
    else throw new Error("Invalid Address");
  }
};

class User extends DBBase {
  async register(address, kycmethod, kycaux) {
    try {
      address = this.validateAddress(address);
      const conn = await this.getDbConnection();
      await conn.query(`INSERT INTO public."User" ("Address", "CreateDt", "KYCMethod", "KYCAux") VALUES ($1, now(), $2, $3);`, [address, kycmethod, kycaux]);
    } catch (e) {
      console.log(`WARNING: Can't add user`);
      console.log(e);
    }
  }

  async get(address) {
    try {
      address = this.validateAddress(address);
 
      // Get user from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."User" WHERE "Address" = '${address}';`);
      if (res.rows.length > 0) 
        return res.rows[0];
    } catch (e) {}

    return null;
  }

  async getByKyc(method, aux) {
    // Get user from the DB
    const conn = await this.getDbConnection();
    const res = await conn.query(`SELECT * FROM public."User" WHERE "KYCMethod" = '${method}' and "KYCAux" = '${aux}';`);
    if (res.rows.length > 0) 
      return res.rows[0];

    return null;
  }

}

module.exports = {
  User
};