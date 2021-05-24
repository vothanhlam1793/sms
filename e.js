const express = require('express');
const bodyParser = require('body-parser');
const sms = require('./m')
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get("/start", (req, res)=>{
    res.send(sms.start(function(ret){
        console.log(ret);
    }));
});

app.get("/stop", (req, res)=>{
    res.send(sms.stop(function(ret){
        console.log(ret);
    }));
});

app.post("/sms", function(req, res){
    res.send(sms.send(req.body.data, function(ret){
        console.log(ret);
    }));
});


app.get("/status", function(req, res){
    res.send(sms.status());
})

// app.post('/sms', (req, res) => {
//     console.log('Got body:', req.body);
//     sms.sendSMS(req.body.data, function(e){
//         res.send(e);
//     })
// });

app.listen(7776, () => console.log(`Started server at http://localhost:7776!`));