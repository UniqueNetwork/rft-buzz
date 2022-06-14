const config = require('./config');
const { Client } = require('pg');
const fs = require('fs');

var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 12, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.' });

const migrations = [
  { file: "./migration01.sql", condition: always_yes }
]

let dbClient = null;

const pgTables = {
  bonusAddress: 'BonusAddress'
}

async function getDbConnection() {
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
  }
  return dbClient;
}

async function always_yes(conn) {
  return true;
}

async function runMigration(i) {
  console.log(`  Running migration ${i+1}`);
  const conn = await getDbConnection();

  // Check if migration is needed
  const need = await migrations[i].condition(conn);
  if (need) {
    await conn.query(fs.readFileSync(migrations[i].file).toString());
  }

  console.log(`  Finished migration ${i+1}`);
}

async function main() {
  console.log("Starting migrations");
  for (let i=0; i<migrations.length; i++)
    await runMigration(i);
}

main().catch(console.error).finally(() => process.exit());