const express = require('express');
const cors = require('cors')

const port = 3002;

const app = express();
app.use(express.static('./dist'));
app.use(cors());

var corsOptions = {
    origin: 'https://web-quartz.unique.network/',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

app.listen(port, () => console.log(`App listening on port ${port}!`));
