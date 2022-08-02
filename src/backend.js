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
    if (ret.length > 0) return ret.toLowerCase();
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

  async addEmail(address, email) {
    try {
      address = this.validateAddress(address);
      const conn = await this.getDbConnection();
      await conn.query(`UPDATE public."User" SET "Email" = $1 WHERE "Address" = '${address}';`, [email]);
    } catch (e) {
      console.log(`WARNING: Can't add email`);
      console.log(e);
    }
  }

  async get(address) {
    try {
      address = this.validateAddress(address);
 
      // Get user from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."User" WHERE LOWER("Address") = '${address}';`);
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

  async getAll() {
    try {
      // Get all users from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."User";`);
      if (res.rows.length > 0) 
        return res.rows;
    } catch (e) {}

    return null;
  }

  async getCount() {
    try {
      // Get all users from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT count(*) as "Count" FROM public."User";`);
      if (res.rows.length > 0) 
        return res.rows[0].Count;
    } catch (e) {}
  }

  async getEmailCount() {
    try {
      // Get all distinct emails from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT count(DISTINCT "Email") as "Count" FROM public."User";`);
      if (res.rows.length > 0) 
        return res.rows[0].Count;
    } catch (e) {}
  }

}

class Vote extends DBBase {
  async add(address, pollId, message, signature) {
    try {
      address = this.validateAddress(address);
      const conn = await this.getDbConnection();
      await conn.query(`INSERT INTO public."Vote" ("Address", "CreateDt", "PollId", "Message", "Signature") VALUES ($1, now(), $2, $3, $4);`, [address, pollId, message, signature]);
      return true;
    } catch (e) {
      if (!e.message.includes("duplicate key")) {
        console.log(`WARNING: Can't add vote`);
        console.log(e);
      }
      return false;
    }
  }

  async get(address, pollId) {
    try {
      address = this.validateAddress(address);
      pollId = parseInt(pollId);
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."Vote" WHERE LOWER("Address") = '${address}' AND "PollId" = ${pollId};`);
      if (res.rows.length > 0) 
        return res.rows[0].Message;
    } catch (e) {
      console.log(`WARNING: Can't read vote`);
      console.log(e);
      return false;
    }
  }

  async getAll() {
    try {
      // Get all votes from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."Vote";`);
      if (res.rows.length > 0) 
        return res.rows;
    } catch (e) {}

    return null;
  }

  async getVoteCount() {
    try {
      // Get all votes from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT count(*) as "c" FROM public."Vote";`);
      if (res.rows.length > 0) 
        return res.rows[0].c;
    } catch (e) {}

    return null;
  }

  async getTallies() {
    try {
      // Get vote tallies from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT count(*) as "c", "Message" FROM public."Vote" GROUP BY "Message" ORDER BY "c" DESC LIMIT 3;`);
      if (res.rows.length > 0) 
        return res.rows;
    } catch (e) {}

    return null;
  }

}

class Human extends DBBase {

  validate(telegramId) {
    return '' + parseInt(telegramId);
  }

  async get(telegramId) {
    try {
      const telegramIdValidated = this.validate(telegramId);
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT * FROM public."Human" where "TelegramId" = $1;`, [telegramIdValidated]);
      if (res.rows.length > 0) {
        return { Status: res.rows[0].Status, Challenge: res.rows[0].Challenge };
      }
      else {
        await conn.query(`INSERT INTO public."Human" ("TelegramId", "Status") VALUES ($1, $2);`, [telegramIdValidated, 0]);
        return { Status: 0, Challenge: null };
      }

    } catch (e) {
      console.log(e);
    }
  }

  async setStatus(telegramId, status) {
    try {
      const telegramIdValidated = this.validate(telegramId);
      const conn = await this.getDbConnection();
      await conn.query(`UPDATE public."Human" SET "Status" = ${status} WHERE "TelegramId" = '${telegramIdValidated}';`);
    } catch (e) {
      console.log(e);
    }

    return null;
  }

  async setChallenge(telegramId, challenge) {
    try {
      const telegramIdValidated = this.validate(telegramId);
      const conn = await this.getDbConnection();
      await conn.query(`UPDATE public."Human" SET "Challenge" = '${challenge}' WHERE "TelegramId" = '${telegramIdValidated}';`);
    } catch (e) {
      console.log(e);
    }

    return null;
  }

  async getBotCount() {
    try {
      // Get all users from the DB
      const conn = await this.getDbConnection();
      const res = await conn.query(`SELECT count(*) as "Count" FROM public."Human" where "Status" <> 2;`);
      if (res.rows.length > 0) 
        return res.rows[0].Count;
    } catch (e) {}
  }



}

module.exports = {
  User,
  Vote,
  Human
};