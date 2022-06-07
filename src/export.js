const fs = require('fs');
const { User } = require('./backend');

const user = new User();

const outputFile = "/data/rft-registration-export.csv";

async function main() {
  const users = await user.getAll();

  fs.writeFileSync(outputFile, "");
  if (users) {
    for (let i=0; i<users.length; i++) {
      fs.appendFileSync(outputFile, `${users[i].Address},${users[i].CreateDt},${users[i].KYCMethod},${users[i].KYCAux},${users[i].Email}\n`);
  
      if (i % 100 == 0) console.log(`${i} of ${users.length}`);
    }
  }

  console.log("FINISHED");
}

main().catch(console.error).finally(() => process.exit());