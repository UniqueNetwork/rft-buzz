const { ApiPromise, WsProvider } = require('@polkadot/api');
const config = require('./config');
const express = require('express');
const { User } = require('./backend');

const user = new User();

var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 12, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.' });

// Configure Express
const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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

app.listen(config.port, () => console.log(`App listening on port ${config.port}!`));
