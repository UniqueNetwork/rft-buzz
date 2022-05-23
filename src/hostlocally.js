const express = require('express');

const port = 3002;

const app = express();
app.use(express.static('./dist'));

app.listen(port, () => console.log(`App listening on port ${port}!`));
