const express = require('express');
const bodyParser = require('body-parser');
const sms = require('./m')
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.post('/sms', (req, res) => {
    console.log('Got body:', req.body);
    sms.sendSMS(req.body.data, function(e){
        res.send(e);
    })
});

app.listen(7776, () => console.log(`Started server at http://localhost:7776!`));