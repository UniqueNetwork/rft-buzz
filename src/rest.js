const { cryptoWaitReady, decodeAddress, signatureVerify } = require('@polkadot/util-crypto');
const { recoverPersonalSignature } = require('@metamask/eth-sig-util');
const { u8aToHex } = require('@polkadot/util');
const config = require('./config');
const express = require('express');
const { User, Vote } = require('./backend');
const { Unique } = require('./unique');

const user = new User();
const vote = new Vote();
const unique = new Unique();

const VOTING_ON = true;

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
const votingOptions = [3525 ,5674 ,2597 ,5684 ,3710 ,3711 ,3935 ,3372 ,3640 ,3433 ,3629 ,3723 ,792 ,2297 ,9777 ,2251 ,448 ,9742 ,2857 ,9026 ,3604 ,9290 ,1281 ,1608 ,730 ,8466 ,6895 ,346 ,6623 ,8095 ,8995 ,5911 ,6991 ,4367 ,9734 ,1256 ,7045 ,3951 ,3277 ,6988 ,9890 ,1353 ,9736 ,3308 ,6121 ,4860 ,6525 ,3055 ,8540 ,6571 ,6596 ,2185 ,2992 ,1557 ,3058 ,5443 ,3114 ,522 ,1928 ,7679 ,1299 ,5342 ,2489 ,2546 ,4494 ,5203 ,4479 ,4491 ,5361 ,7857 ,6740 ,7820 ,6503 ,5150 ,5385 ,6849 ,8643 ,7218 ,766 ,6604 ,4947 ,5345 ,9460 ,4864 ,9835 ,2531 ,5807 ,5453 ,4837 ,8181 ,9607 ,1344 ,6440 ,3775 ,9127 ,7493 ,1812 ,3260 ,7200 ,7822 ,3763 ,2238 ,1393 ,4613 ,5514 ,2348 ,5136 ,9351 ,6474 ,9532 ,4215 ,3479 ,1865 ,9122 ,2911 ,4464 ,8893 ,9444 ,342 ,2032 ,7503 ,754 ,451 ,4764 ,7797 ,6806 ,2584 ,2776 ,1775 ,3581 ,1427 ,7893 ,3669 ,8561 ,2407 ,3143 ,5984 ,3794 ,2629 ,4728 ,4972 ,6884 ,8232 ,5054 ,1657 ,6198 ,6163 ,8722 ,9797 ,724 ,4770 ,4298 ,6842 ,731 ,4142 ,2780 ,1031 ,2585 ,2816 ,2181 ,5314 ,492 ,5164 ,6727 ,9816 ,6911 ,4967 ,3318 ,5371 ,5897 ,943 ,2690 ,7262 ,4095 ,8733 ,3105 ,6610 ,693 ,807 ,9529 ,9623 ,4891 ,6202 ,2131 ,1607 ,8360 ,5282 ,7131 ,5748 ,6662 ,4119 ,5879 ,4140 ,3282 ,5007 ,8496 ,7863 ,6877 ,4194 ,1617 ,3387 ,669 ,3194 ,7849 ,1751 ,5188 ,8514 ,1404 ,4355 ,2431 ,5285 ,9092 ,1583 ,659 ,1961 ,9921 ,7023 ,7934 ,9121 ,1091 ,941 ,6861 ,2177 ,3236 ,5876 ,4164 ,3665 ,7702 ,7270 ,3869 ,8504 ,1201 ,1752 ,6708 ,3894 ,2616 ,8112 ,7683 ,2837 ,3549 ,2840 ,4431 ,6603 ,3728 ,7135 ,1158 ,2936 ,6686 ,8010 ,6904 ,8680 ,4306 ,1093 ,3938 ,5587 ,3664 ,1464 ,9187 ,4453 ,5224 ,3160 ,1857 ,1515 ,6270 ,7785 ,2169 ,3471 ,6191 ,1508 ,4584 ,2581 ,5107 ,2910 ,2761 ,7659 ,2886 ,7063 ,2153 ,1665 ,3437 ,5955 ,3594 ,2172 ,887 ,3214 ,2166 ,8851 ,1592 ,2072 ,3222 ,6677 ,5555 ,6263 ,7551 ,8325 ,222 ,2147 ,252 ,312 ,6802 ,7677 ,9119 ,2299 ,4038 ,2438 ,8220 ,2863 ,6088 ,6209 ,5949 ,3092 ,9120 ,9922 ,5429 ,1279 ,9660 ,6598 ,7111 ,9604 ,3781 ,6358 ,5752 ,4844 ,3815 ,5309 ,5019 ,6949 ,5236 ,1911 ,100 ,69 ,7829 ,6752 ,1940 ,8931 ,3246 ,2912 ,9000 ,7191 ,996 ,9898 ,4019 ,8034 ,7210 ,7026 ,7833 ,9014 ,9152 ,6238 ,8068 ,6124 ,7024 ,6775 ,6898 ,3204 ,7632 ,1944 ,3940 ,3856 ,5844 ,7095 ,4928 ,9561 ,4147 ,6912 ,1513 ,7096 ,7983 ,2175 ,6177 ,8127 ,1074 ,7212 ,7276 ,7537 ,5927 ,4915 ,6220 ,6656 ,6713 ,1541 ,3389 ,440 ,533 ,160 ,1864 ,4015 ,4555 ,4785 ,6989 ,8013 ,7501 ,7216 ,6809 ,9435 ,8564 ,2895 ,9919 ,4322 ,1117 ,2353 ,8664 ,6913 ,487 ,933 ,2575 ,2682 ,3453 ,1941 ,4047 ,8432 ,8135 ,8834 ,5151 ,6758 ,6148 ,6414 ,4872 ,5566 ,1602 ,8065 ,9895 ,1536 ,6425 ,9696 ,6552 ,7971 ,7162 ,4413 ,1470 ,5835 ,3178 ,5509 ,8350 ,9567 ,5504 ,7209 ,5454 ,8100 ,5776 ,9944 ,4690 ,7695 ,2338 ,5726 ,9882 ,604 ,5810 ,2526 ,8901 ,3250 ,5963 ,5451 ,8134 ,8885 ,6382 ,7957 ,7480 ,7022 ,6772 ,8644 ,5077 ,7043 ,579 ,3043 ,9658 ,8099 ,8187 ,9594 ,4874 ,7771 ,5047 ,1727 ,5720 ,6212 ,7099 ,5066 ,8659 ,4597 ,3355 ,3645 ,3051 ,7981 ,532 ,8027 ,6123 ,3915 ,2212 ,9055 ,2602 ,3983 ,2286 ,2362 ,1646 ,4852 ,6230 ,9830 ,5942 ,8726 ,6791 ,4033 ,2593 ,8286 ,4911 ,6297 ,7144 ,3376 ,9433 ,2011 ,6146 ,7319 ,8877 ,2666 ,7082 ,9789 ,7848 ,9384 ,5633 ,6921 ,6854 ,4174 ,4688 ,6690 ,4385 ,5847 ,2393 ,7967 ,2562 ,5871 ,7199 ,9499 ,9071 ,8407 ,8373 ,4461 ,8089 ,4456 ,6190 ,521 ,3011 ,1243 ,1337 ,1559 ,1419 ,671 ,526 ,1616 ,625 ,870 ,1847 ,956 ,6367 ,7628 ,4580 ,5838 ,9927 ,5862 ,6450 ,3467 ,2346 ,3212 ,6029 ,5930 ,8171 ,7422 ,6935 ,6593 ,703 ,6927 ,1460 ,5826 ,9468 ,3384 ,7495 ,7309 ,1205 ,9995 ,8775 ,1318 ,2483 ,2133 ,3480 ,3185 ,1151 ,2354 ,7438 ,173 ,215 ,245 ,1984 ,2788 ,4386 ,888 ,4457 ,3569 ,5789 ,1340 ,4145 ,9013 ,6280 ,7566 ,3864 ,3574 ,3426 ,6318 ,4730 ,6629 ,6641 ,352 ,2829 ,4202 ,5003 ,9020 ,7177 ,4895 ,1481 ,5786 ,8263 ,2016 ,1520 ,8094 ,7086 ,9715 ,6045 ,5281 ,6355 ,9719 ,2621 ,3878 ,1809 ,1902 ,5575 ,1765 ,2882 ,9027 ,6085 ,8021 ,4365 ,7369 ,9841 ,6897 ,5923 ,1086 ,5061 ,571 ,7181 ,7128 ,6784 ,5852 ,7728 ,9109 ,1777 ,9761 ,8207 ,6592 ,9678 ,2773 ,7254 ,7264 ,5128 ,7759 ,2422 ,4701 ,141 ,8335 ,8518 ,7183 ,4495 ,2479 ,9915 ,2937 ,5691 ,7291 ,3298 ,9925 ,9599 ,3186 ,2350 ,4191 ,4037 ,9555 ,9057 ,7334 ,2902 ,8855 ,233 ,1240 ,5833 ,8778 ,9852 ,3787 ,6070 ,8144 ,3369 ,4102 ,7211 ,9799 ,9624 ,387 ,417 ,3002 ,812 ,926 ,6902 ,6672 ,5542 ,9172 ,682 ,4833 ,1234 ,276 ,4775 ,2741 ,8111 ,7046 ,1451 ,6972 ,7151 ,4440 ,4260 ,8121 ,5858 ,5222 ,8749 ,5545 ,9769 ,9247 ,8818 ,9123 ,3210 ,7117 ,7948 ,1568 ,5097 ,4561 ,4073 ,3173 ,1321 ,2467 ,7816 ,1463 ,9328 ,1388 ,3954 ,5069 ,7904 ,1868 ,117 ,359 ,594 ,839 ,3342 ,924 ,949 ,966 ,970 ,1060 ,1081 ,1120 ,1174 ,1255 ,1323 ,5895 ,1345 ,1371 ,1396 ,1442 ,1495 ,1546 ,1564 ,1628 ,1635 ,1684 ,1710 ,1749 ,1763 ,1853 ,1906 ,2083 ,2242 ,2347 ,2521 ,2544 ,2594 ,2758 ,2875 ,2954 ,2989 ,3032 ,3047 ,3049 ,3122 ,3132 ,6822 ,4527 ,4248 ,3184 ,3230 ,3292 ,3515 ,3578 ,3695 ,3713 ,3795 ,3811 ,3862 ,3895 ,3996 ,4071 ,4162 ,4165 ,4189 ,4224 ,4237 ,4295 ,4398 ,4463 ,4543 ,4552 ,4709 ,4759 ,4810 ,4814 ,4851 ,4918 ,4855 ,5032 ,5138 ,5424 ,5484 ,5494 ,5502 ,5526 ,5579 ,5637 ,5728 ,5812 ,5926 ,6052 ,6054 ,6072 ,6094 ,6140 ,6261 ,6278 ,6311 ,6346 ,6352 ,6417 ,6492 ,6549 ,6557 ,6586 ,6709 ,6826 ,6892 ,6982 ,6993 ,7025 ,7109 ,7147 ,7156 ,7429 ,7431 ,7694 ,7749 ,7819 ,7866 ,7914 ,8126 ,8149 ,8156 ,8281 ,8311 ,8334 ,8367 ,8525 ,8805 ,8828 ,8839 ,8858 ,8941 ,8946 ,8971 ,9049 ,9124 ,9140 ,9150 ,9156 ,9261 ,9263 ,9359 ,9365 ,9448 ,9535 ,9572 ,9644 ,9804 ,9826 ,9647 ,4951 ,1694 ,5809 ,6309 ,2684 ,4471 ,4497 ,6122 ,3520 ,4900 ,2073 ,8535 ,6243 ,4059 ,5049 ,7315 ,7330 ,9190 ,4055 ,4428 ,259 ,1433 ,356 ,945 ,2255 ,2218 ,732 ,1527 ,6944 ,9393 ,3207 ,6584 ,8480 ,5905 ,4353 ,9395 ,2519 ,1163 ,5690 ,6950 ,2932 ,8699 ,6402 ,5130 ,2427 ,1041 ,4016 ,3163 ,5672 ,8191 ,3147 ,4414 ,6661 ,2163 ,6771 ,5241 ,4761];

// Output parameters
console.log("Starting RFT campaign backend");
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

async function isAddressEligibleForVoting(address) {
  let eligible = false;
  try {
    // Is address registered in campaign?
    const u = await user.get(address);

    if (u) {
      eligible = true;
    }
    else {
      // Does address have required balances?
      if (!address.startsWith("0x"))
        eligible = await unique.isSubstrateAddressEligible(address);
    }
  } catch (e) {
    console.log(e);
  }
  return eligible;
}

// POST request for adding address vote
app.post('/vote', async function(req, res) {
  try {
    if (!VOTING_ON) {
      res.status(400).send('Voting is not active');
      return;
    }

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

    // Check if address is eligible
    const eligible = await isAddressEligibleForVoting(address);
    if (!eligible) {
      res.status(400).send('Address is not eligible for voting. You should own one of the following: a Substrapunk, a Chelobrick, a Polkadot Ambassador token, or 500+ QTZ OR you should register in RFT campaign in telegram: https://t.me/unique_rft_bot');
      return;
    }

    // Verify signature
    if (address.startsWith("0x")) {
      const recoveredAddr = recoverPersonalSignature({
        data: "Voting for PNK " + message,
        signature: signature
      });
      if (address != recoveredAddr) {
        res.status(400).send('Invalid Signature');
        return;
      }
    }
    else {
      await cryptoWaitReady();
      if (!verifySignature(address, message, signature)) {
        res.status(400).send('Invalid Signature');
        return;
      }
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
