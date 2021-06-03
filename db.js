//Import the mongoose module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var MessageSchema = new Schema({
    messageId: String,
    message: String,
    state: String,
    phone: String
});
var MessageModel = mongoose.model('MessageModel', MessageSchema);

var mongoDB = 'mongodb://svr8.creta.vn:27017/mydb';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    
}).catch(function(){
    console.log("ERROR");
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('open', function(){
    console.log("OPEN DATABASE");
})

module.exports.MessageModel = MessageModel;
/* 
    0 - CREATE
    1 - SENDING
    2 - SENT
    3 - ERROR
*/