const express = require('express');

const app = express();

app.use(express.static('public'));

const port = 1919;
app.listen(port, () => console.log('listening on port', port));
