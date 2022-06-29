require('dotenv').config()
const { Telegraf } = require('telegraf')
const { User, Human } = require('./backend');
const fs = require('fs');
const Web3 = require('web3');
const converter = require('number-to-words');

const { Keyring } = require('@polkadot/api');
const config = require('./config');

const user = new User();
const human = new Human();

const bot = new Telegraf(process.env.TG_TOKEN) //TG_TOKEN contains the bot ID

const PATH_LOG = `/logs/bot_log.csv`;

let addresses = {};
let emails = {};

bot.catch((err) => {
  console.log('==== Ooops', err)
})

bot.start((ctx) => ctx.reply(`
Hi ${ctx.from.first_name}!

Welcome to Unique RFT Campaign! Here you can leave your wallet address to receive a FREE fraction of cryptopunk 3042.

Make sure you use an address that you have created with Metamask or Polkadot{.js}. Do not use addresses from exchanges, Ledger or other wallets as they will not support RFTs properly. Either Substrate (Polkadot, Kusama, Unique, or Quartz) or Ethereum addresses are acceptable.
`).catch( function(error){ console.error(error); } ))

const msg = `Please enter your wallet address.`;

bot.help((ctx) => ctx.reply(msg)
.catch( function(error){
  console.error(error); } )) //bot answers to /help command
bot.hears('hi', (ctx) => ctx.reply('Hey there').catch( function(error){ console.error(error); } )) // bot.hears - the handler of essential text, in this particular case the text is "hi". We will use it as a heartbeat check.

bot.hears('statsforgeeks2022', async (ctx) => {
  const count = await user.getCount();  
  const botcount = await human.getBotCount();  
  ctx.reply(`Total registrations: ${count}\nBot count: ${botcount}`).catch( function(error){ console.error(error); } )
})

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
    return true;
  }
  return false;
}

function validateEmail(email) {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function bufferEmail(msg, userId) {
  try {
      if (validateEmail(msg)) {
          emails[userId] = msg;
          return true;
      }
  } catch (e) {}
  return false;
}

async function challenge(ctx, again) {
  const a = getRandomInt(10);
  const b = getRandomInt(10);
  const c = getRandomInt(2);
  const problem = `${again ? 'Wrong answer, try again. ':'Just a quick check: '}${converter.toWords(a)} ${c == 0 ? 'times' : 'plus'} ${converter.toWords(b)} is ...`;

  ctx.reply(problem).catch( function(error){ console.error(error); } );
  await human.setChallenge(ctx.message.from.id, JSON.stringify({ a: a, b: b, c: c }));
  await human.setStatus(ctx.message.from.id, 1);
}

bot.on('text', async (ctx) => {

  try {
    console.log('=== ', Date(), ' ===');
    console.log(`Registration request: ${ctx.message.from.id}, tg handle: ${ctx.message.from.username}`);

    const addressMessage = bufferAddress(ctx.message.text, ctx.message.from.id);
    const emailMessage = bufferEmail(ctx.message.text, ctx.message.from.id);

    // Check if this is a human
    let h = await human.get(ctx.message.from.id);
    if (h.Status == 0) {
      await challenge(ctx, false);
    }
    else if (h.Status == 1) { // Question has been asked
      const { a, b, c } = JSON.parse(h.Challenge);

      let expected_answer = a;
      if (c == 0) expected_answer *= b;
      else expected_answer += b;

      const given_answer = parseInt(ctx.message.text);

      if (given_answer == expected_answer) {
        await human.setStatus(ctx.message.from.id, 2);
      }
      else {
        await challenge(ctx, true);
      }
    }

    h = await human.get(ctx.message.from.id);
    if (h.Status == 2) {
      // This is a human, we can continue. Register, then add email
      const u = await user.getByKyc("telegram", ctx.message.from.id);
      const email = ((u) && (u.Email) && (u.Email.length > 3)) || (emails[ctx.message.from.id] !== undefined);

      if (u) {
        if (!emailMessage) ctx.reply(`You have already registered an address previously: ${u.Address}\n\n${email ? '':'\n\nBut you have not yet provided an email address. Please enter your email address if you would like to receive updates about Unique Network!'} \n\n https://unique.network/punk/`).catch( function(error){ console.error(error); } );
      }
      else if (addresses[ctx.message.from.id] === undefined) {
          ctx.reply(`The address you provided is incorrect, please try again.`).catch( function(error){ console.error(error); } );
      }
      else {
        await user.register(addresses[ctx.message.from.id], "telegram", ctx.message.from.id);
        delete addresses[ctx.message.from.id]; // cleanup

        ctx.reply(`Thank you for registering for RFT campaign! Now you can get back and stay tuned.\n\n https://unique.network/punk/ ${email ? '':'\n\nAlso, you can enter your email address here if you would like to receive updates about Unique Network!'}`).catch( function(error){ console.error(error); } );
        fs.appendFileSync(PATH_LOG, `${Date()},${ctx.message.from.id},${ctx.message.from.username},${ctx.message.from.first_name},${ctx.message.from.last_name},${ctx.message.text}\n`);
      }

      // Handle emails
      if ((u) && (!u.Email) && (emails[ctx.message.from.id] !== undefined)) {
        await user.addEmail(u.Address, emails[ctx.message.from.id]);
        if (emailMessage) 
          ctx.reply(`Thank you for providing your email address!`).catch( function(error){ console.error(error); } );
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