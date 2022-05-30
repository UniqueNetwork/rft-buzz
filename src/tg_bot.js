require('dotenv').config()
const { Telegraf } = require('telegraf')
const { User } = require('./backend');
const fs = require('fs');
const user = new User();
const Web3 = require('web3');
const converter = require('number-to-words');

const { Keyring } = require('@polkadot/api');
const config = require('./config');

const bot = new Telegraf(process.env.TG_TOKEN) //TG_TOKEN contains the bot ID

const PATH_LOG = `/logs/bot_log.csv`;

let humans = {};
let addresses = {};

bot.catch((err) => {
  console.log('==== Ooops', err)
})

bot.start((ctx) => ctx.reply(`
Hi ${ctx.from.first_name}!
Please enter your wallet address to register for RFT campaign. Make sure you use an address that you have created with Metamask or Polkadot{.js}. Do not use addresses from exchanges, Ledger or other wallets as they will not support RFTs properly. Either Substrate (Polkadot, Kusama, Unique, or Quartz) or Ethereum addresses are acceptable.
`).catch( function(error){ console.error(error); } ))

const msg = `Please enter your wallet address.`;

bot.help((ctx) => ctx.reply(msg)
.catch( function(error){
  console.error(error); } )) //bot answers to /help command
bot.hears('hi', (ctx) => ctx.reply('Hey there').catch( function(error){ console.error(error); } )) // bot.hears - the handler of essential text, in this particular case the text is "hi". We will use it as a heartbeat check.

function ss58(address) {
  // Convert address to ss58 format
  const keyring = new Keyring();
  const publickey = keyring.decodeAddress(address);
  return keyring.encodeAddress(publickey, config.ss58prefix);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function bufferAddress(msg, userId) {
  let address = '';
  try {
      if (msg.startsWith("0x")) {
          if (Web3.utils.isAddress(msg))
          address = msg;
      } else {
          address = ss58(msg);
          console.log('Address check is ok (ss58)');
      }
  } catch (e) {}
  if (address.length > 0) {
    addresses[userId] = address;
  }
}

function challenge(ctx, again) {
  const a = getRandomInt(100);
  const b = getRandomInt(100);
  const c = getRandomInt(2);
  const problem = `${again ? 'Wrong answer, try again. ':'Just a quick check: '}${converter.toWords(a)} ${c == 0 ? 'times' : 'plus'} ${converter.toWords(b)} is ...`;

  ctx.reply(problem).catch( function(error){ console.error(error); } );
  humans[ctx.message.from.id] = { a: a, b: b, c: c };
}

bot.on('text', async (ctx) => {

  try {
    console.log('=== ', Date(), ' ===');
    console.log(`Registration request: ${ctx.message.from.id}, tg handle: ${ctx.message.from.username}`);

    bufferAddress(ctx.message.text, ctx.message.from.id);

    // Check if this is a human
    if (humans[ctx.message.from.id] === undefined) {
      challenge(ctx, false);
    }
    else if (humans[ctx.message.from.id].a !== undefined) { // Question has been asked
      const a = humans[ctx.message.from.id].a;
      const b = humans[ctx.message.from.id].b;
      const c = humans[ctx.message.from.id].c;
      let expected_answer = a;
      if (c == 0) expected_answer *= b;
      else expected_answer += b;

      const given_answer = parseInt(ctx.message.text);

      if (given_answer == expected_answer) {
        humans[ctx.message.from.id] = true;
      }
      else {
        delete humans[ctx.message.from.id];
        challenge(ctx, true);
      }
    }

    if (humans[ctx.message.from.id] === true) {
      // Register
      const u = await user.getByKyc("telegram", ctx.message.from.id);

      if (u) {
          ctx.reply(`You have already registered an address previously: ${u.Address}`).catch( function(error){ console.error(error); } );
      }
      else if (addresses[ctx.message.from.id] === undefined) {
          ctx.reply(`The address you provided is incorrect, please try again.`).catch( function(error){ console.error(error); } );
      }
      else {
        await user.register(addresses[ctx.message.from.id], "telegram", ctx.message.from.id);
        delete addresses[ctx.message.from.id]; // cleanup

        ctx.reply(`Thank you for registering for RFT campaign! Get back to the RFT campaign page and stay tuned for the next steps!`).catch( function(error){ console.error(error); } );
        fs.appendFileSync(PATH_LOG, `${Date()},${ctx.message.from.id},${ctx.message.from.username},${ctx.message.from.first_name},${ctx.message.from.last_name},${ctx.message.text}\n`);
      }
    }
  } 
  catch(e) {
    console.log('Exception: ', e)
  }
  console.log('===========================');
})

console.log('==================== START ====================');
bot.launch() // launch of our bot