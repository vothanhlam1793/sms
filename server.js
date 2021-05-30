var express = require('express');
var app = express();
var m = require("./StateModem");

var modem = new m.Modem();
app.get('/state', function(req, res){
    console.log(modem);
    res.send(modem.state.toString());
});

app.get('/start', function(req, res){
    console.log(modem.start());
    res.send(modem.state.toString());
});
app.get('/stop', function(req, res){
    console.log(modem.stop());
    res.send(modem.state.toString());
});
app.get('/send', function(req, res){
    query = req.query;
    console.log(query); 
    console.log(modem.sendSMS(query.phone, query.message));
    res.send(modem.state.toString());
});

app.listen(3000);