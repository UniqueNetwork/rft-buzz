const { cryptoWaitReady, decodeAddress, signatureVerify } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');
const config = require('./config');
const express = require('express');
const { User, Vote } = require('./backend');

const user = new User();
const vote = new Vote();

var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 12, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.' });

// Configure Express
const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.json());

const pollId = 1;
const votingOptions = [9774, 6148, 8220, 7043, 8722, 8877, 8885, 6238, 3178, 4967, 2616, 7695];

// Output parameters
console.log("Starting crowdloan backend");
console.log(`Port: ${config.port}`);

// GET request for querying address registration
app.get('/address', async function(req, res) {
  try {
    const uriprm = req.query.address;
    const u = await user.get(uriprm);

    if (u) {
      res.json({ registered: true });
    } else {
      res.status(404).send('Not found');
    }

  } catch (e) {}
});

// GET request to retrieve voting options
app.get('/vote', async function(req, res) {
  res.json({ votingOptions: votingOptions });
});

app.get('/addrvote', async function(req, res) {
  try {
    const uriprm = req.query.address;
    const message = await vote.get(uriprm, pollId);
    res.json({ message: message });
  }
  catch (e) {
    console.log(e);
    res.status(500).send('Server error');
  }
});

function parseMessage(message) {
  const opt = parseInt(message);
  if (votingOptions.includes(opt)) return opt;
  return null;
}

function verifySignature(address, message, signature) {
  // console.log("verifySignature params:", address, message, signature);
  const publicKey = decodeAddress(address);
  const hexPublicKey = u8aToHex(publicKey);
  return signatureVerify('' + message, signature, hexPublicKey).isValid;
}

// POST request for adding address vote
app.post('/vote', async function(req, res) {
  try {
    const body = req.body;

    // Get JSON parameters
    // Parse message (should be one of available options)
    const address = body.address;
    const message = parseMessage(body.message);
    const signature = body.signature;

    if (!message) {
      res.status(400).send('Invalid Voting Option');
      return;
    }

    // Verify signature
    await cryptoWaitReady();
    if (!verifySignature(address, message, signature)) {
      res.status(400).send('Invalid Signature');
      return;
    }

    // Add vote to DB
    if (await vote.add(address, pollId, message, signature)) {
      res.json({ success: true });
      return;
    } else {
      res.status(400).send('Duplicate Vote');
      return;
    }

  } catch (e) {
    console.log(e);
  }

  res.status(500).send('Server error');
});

app.listen(config.port, () => console.log(`App listening on port ${config.port}!`));
