const fs = require('fs');
const { User, Vote } = require('./backend');

const user = new User();
const vote = new Vote();

const outputFileUsers= "/data/rft-registration-export.csv";
const outputFileVotes = "/data/rft-vote-export.csv";

async function main() {
  // Export registered users
  console.log("Exporting users");
  const users = await user.getAll();
  fs.writeFileSync(outputFileUsers, "");
  if (users) {
    for (let i=0; i<users.length; i++) {
      fs.appendFileSync(outputFileUsers, `${users[i].Address},${users[i].CreateDt},${users[i].KYCMethod},${users[i].KYCAux},${users[i].Email}\n`);
  
      if (i % 100 == 0) console.log(`${i} of ${users.length}`);
    }
  }

  console.log("Exporting votes");
  const votes = await vote.getAll();
  fs.writeFileSync(outputFileVotes, "");
  if (votes) {
    for (let i=0; i<votes.length; i++) {
      fs.appendFileSync(outputFileVotes, `${votes[i].Address},${votes[i].CreateDt},${votes[i].PollId},${votes[i].Message},${votes[i].Signature}\n`);
  
      if (i % 100 == 0) console.log(`${i} of ${votes.length}`);
    }
  }

  console.log("FINISHED");
}

main().catch(console.error).finally(() => process.exit());