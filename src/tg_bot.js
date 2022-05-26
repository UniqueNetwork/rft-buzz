require('dotenv').config()
const { Telegraf } = require('telegraf')
const { User } = require('./backend');
const fs = require('fs');
const user = new User();
const Web3 = require('web3');

const { Keyring } = require('@polkadot/api');
const config = require('./config');

const bot = new Telegraf(process.env.TG_TOKEN) //TG_TOKEN contains the bot ID

const PATH_LOG = `/logs/bot_log.csv`;

bot.catch((err) => {
  console.log('==== Ooops', err)
})

bot.start((ctx) => ctx.reply(`
Hi ${ctx.from.first_name}!
Please enter your wallet address to register for RFT campaign. Either Substrate (Polkadot, Kusama, Unique, or Quartz) or Ethereum addresses are acceptable.
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

bot.on('text', async (ctx) => {

  try {
    console.log('=== ', Date(), ' ===');
    console.log(`Registration request: ${ctx.message.from.id}, tg handle: ${ctx.message.from.username}`);
    const u = await user.getByKyc("telegram", ctx.message.from.id);
    let address = '';
    try {
        if (ctx.message.text.startsWith("0x")) {
            if (Web3.utils.isAddress(ctx.message.text))
            address = ctx.message.text;
        } else {
            address = ss58(ctx.message.text);
            console.log('Address check is ok (ss58)');
        }
    } catch (e) {}

    if (u) {
        ctx.reply(`You have already registered an address previously: ${u.Address}`).catch( function(error){ console.error(error); } );
    }
    else if (address.length == 0) {
        ctx.reply(`The address you provided is incorrect.`).catch( function(error){ console.error(error); } );
    }
    else {
      await user.register(address, "telegram", ctx.message.from.id);
      ctx.reply(`Thank you for registering for RFT campaign! Get back to the RFT campaign page and stay tuned for the next steps!`).catch( function(error){ console.error(error); } );
      fs.appendFileSync(PATH_LOG, `${Date()},${ctx.message.from.id},${ctx.message.from.username},${ctx.message.from.first_name},${ctx.message.from.last_name},${ctx.message.text}\n`);
    }
  } 
  catch(e) {
    console.log('Exception: ', e)
  }
  console.log('===========================');
})

console.log('==================== START ====================');
bot.launch() // launch of our bot