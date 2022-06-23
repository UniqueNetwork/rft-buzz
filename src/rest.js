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
const votingOptions = [9624, 9799, 7211, 4102, 3369, 8144, 6070, 3787, 9852, 8778, 5833, 6444, 1240, 233, 8855, 2902, 7334, 590, 9057, 9555, 4037, 4191, 2350, 3186, 9599, 9925, 3298, 7291, 5691, 2937, 9915, 2479, 4495, 7183, 8518, 8335, 141, 4701, 2422, 7759, 9266, 5128, 7264, 7254, 2773, 9678, 6592, 8207, 9761, 1777, 9109, 7728, 5852, 6784, 7128, 7181, 4600, 571, 5061, 1086, 5923, 6897, 9841, 7369, 4365, 8021, 6085, 9027, 2882, 1765, 5575, 1902, 1809, 3878, 2621, 9719, 7072, 2634, 5159, 6355, 5281, 6045, 9715, 7086, 8094, 1520, 2016, 8263, 5786, 1481, 4895, 7177, 9020, 5003, 4202, 2829, 352, 6641, 6629, 4730, 6318, 3426, 3574, 3864, 7566, 6280, 9013, 4145, 1340, 5789, 3569, 4457, 888, 4386, 2788, 1984, 245, 215, 173, 7438, 2354, 1151, 6248, 1222, 3185, 5811, 3480, 2133, 2483, 1318, 8775, 9995, 1205, 7309, 7495, 3384, 9468, 5826, 1460, 6927, 703, 6593, 6935, 7422, 8171, 5930, 6029, 769, 3212, 2346, 3467, 6450, 5862, 9927, 5838, 4580, 7628, 6367, 956, 1847, 870, 625, 1616, 526, 671, 1419, 1559, 1337, 1243, 3011, 521, 6190, 4456, 8089, 4461, 8373, 8407, 9071, 9499, 7199, 5871, 2562, 7967, 2393, 5847, 4385, 6690, 4688, 4174, 6854, 6921, 5633, 9384, 7848, 9789, 7082, 2666, 8877, 7319, 6146, 2011, 9433, 3376, 7144, 6297, 4911, 8286, 2593, 4033, 6791, 8726, 5942, 9830, 6230, 4852, 1646, 2362, 2286, 3983, 2602, 9055, 2212, 3915, 6123, 8027, 532, 7981, 3051, 3645, 3355, 4597, 8659, 5066, 7099, 6212, 5720, 1727, 5047, 7771, 4874, 9594, 8187, 8099, 9658, 3043, 579, 7043, 5077, 8644, 6772, 7022, 7480, 7957, 6382, 8885, 8134, 5451, 5963, 3250, 8901, 2526, 5810, 604, 9882, 5726, 2338, 7695, 4690, 9944, 5776, 8100, 5454, 7209, 5504, 9567, 8350, 5509, 3178, 5835, 1470, 4413, 7162, 6552, 7971, 9696, 6425, 1536, 9895, 8065, 1602, 5566, 4872, 6414, 6148, 6758, 5151, 8834, 8135, 8432, 4047, 1941, 3453, 2682, 2575, 933, 487, 6913, 8664, 2353, 1117, 4322, 9919, 2895, 8564, 9435, 6809, 7216, 7501, 8013, 6989, 4785, 4555, 4015, 1864, 160, 533, 440, 3389, 1541, 6713, 6656, 6220, 4915, 5927, 7537, 7276, 7212, 1074, 8127, 6177, 2175, 7983, 7096, 1513, 6912, 4147, 9561, 4928, 7095, 5844, 3856, 3940, 1944, 7632, 3204, 6898, 6775, 7024, 6124, 8068, 6238, 9014, 9152, 7833, 7026, 7210, 8034, 4019, 9898, 996, 7191, 7534, 9000, 2912, 3246, 8931, 1940, 6752, 7829, 69, 100, 1911, 5236, 6949, 5019, 3815, 5309, 5353, 9906, 434, 9774, 2528, 9383, 4844, 9914, 5752, 6358, 3781, 9604, 7111, 6598, 2891, 9660, 1279, 5429, 9922, 9120, 3092, 5949, 6209, 6088, 2863, 8220, 2438, 4038, 2299, 9119, 7677, 6802, 312, 7331, 252, 2147, 222, 8325, 7551, 6263, 5555, 6677, 3222, 2072, 1592, 8851, 2166, 3214, 887, 2172, 3594, 5955, 3437, 1665, 2153, 7063, 2886, 7659, 2761, 2910, 5107, 2581, 4584, 1508, 6191, 3471, 2169, 7785, 6270, 1515, 1857, 3160, 5224, 4453, 9187, 1464, 3664, 5639, 375, 5587, 3938, 1093, 4306, 8680, 6904, 8010, 6686, 2936, 1158, 7135, 3728, 6603, 4431, 2840, 3549, 2837, 7683, 8112, 2616, 3894, 6708, 1752, 1201, 8504, 3869, 7270, 7702, 3665, 4164, 5876, 3236, 2177, 6861, 941, 1091, 9121, 7934, 7023, 9921, 1961, 659, 1583, 9092, 5285, 2431, 4355, 1404, 8514, 5188, 1751, 7849, 3194, 669, 3387, 1617, 4194, 6877, 7863, 8496, 5007, 3282, 4140, 5879, 4119, 6662, 5748, 7131, 5282, 8360, 8060, 3617, 1607, 2131, 6202, 4891, 9623, 9529, 807, 693, 6610, 3105, 8733, 4095, 7262, 2690, 943, 5897, 5371, 3318, 4967, 6911, 9816, 6727, 5164, 492, 5314, 2181, 2816, 2585, 1031, 2780, 4142, 731, 6842, 4298, 4770, 724, 9797, 8722, 6163, 6198, 1657, 5054, 8232, 6884, 4972, 4728, 2629, 3794, 5984, 3143, 2407, 8561, 9865, 3669, 7893, 1427, 3581, 1775, 2776, 2584, 6806, 7797, 4764, 451, 754, 7503, 2032, 342, 9444, 8893, 4464, 2911, 9122, 1865, 3479, 4215, 9532, 6474, 9351, 5136, 2348, 5514, 4613, 1393, 2238, 7822, 3763, 7200, 3260, 1812, 7493, 9127, 3775, 1344, 6440, 9607, 8181, 4837, 5453, 5807, 2531, 9835, 4864, 9460, 5345, 4947, 6604, 766, 7218, 8643, 5385, 6849, 5150, 6503, 7820, 6740, 7857, 5361, 4491, 4479, 5203, 4494, 2546, 2489, 5342, 1299, 7679, 1928, 522, 3114, 5443, 3058, 1557, 2992, 2185, 6596, 6571, 8540, 3055, 6525, 4860, 6121, 3308, 9736, 9890, 1353, 6988, 3277, 3951, 7045, 1256, 9734, 4367, 6991, 5911, 8995, 8095, 6623, 346, 6895, 2809, 8466, 730, 1608, 1281, 9290, 3604, 9026, 2857, 9742, 448, 2251, 9777, 2297, 792, 3723, 3629, 3433, 3640, 3372, 3935, 3711, 3710, 5684, 2597, 5674, 3525];

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
