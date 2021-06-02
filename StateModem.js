var model = require("./db");
var MessageModel = model.MessageModel;

let serialportgsm = require('serialport-gsm')
// let pathSerial = "/dev/ttyUSB0";
let pathSerial = "/dev/tty.SLAB_USBtoUART";
let options = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: '',
    logger: console
}

class StartState{   
    handle(cmd, data, _modem, cb, next_state){
        switch(cmd){
            case "open": {
                _modem.modem.open(pathSerial, options);
                // Waiting for Event -> IDLE will change by Callback,Emit
            } break;
            case "idle": {
                next_state = STATE_MODEM.IDLE;
            } break;
            case "close": {
                next_state = STATE_MODEM.START;
            }
            default: {
                console.log("START_STATE: not support");
            }
        }
    }
}


function createMessageModel(data){
    var m = new MessageModel(data);
    m.state = "CREATE";
    m.save();
    return m;
}

function findMessageIdAndUpdate(data){
    MessageModel.find({messageId: data.messageId}, function(e, d){
        if(e){

        } else {
            if(d.length > 0){
                // Cai cu
                MessageModel.findByIdAndUpdate(d[0]._id, data, function(){
                    console.log("Da up date");
                })
            } else {
                // Tao moi
                var m = new MessageModel(data);
                // m.state = "SENDING";
                m.save();
                return m;            
            }
        }
    })
}
function sendingMessageModel(data){
    data.state = "SENDING";
    findMessageIdAndUpdate(data);
}

function sentMessageModel(data){
    data.state = "SENT";
    findMessageIdAndUpdate(data);
}
i =0;
class IdleState {
    handle(cmd, data, _modem, cb, next_state){
        switch(cmd){
            case "sendSMS": {
                _modem.modem.sendSMS(data.phone, data.message, true, function(a){
                    console.log("Callback")
                    console.log(i++, a);
                });
                next_state = STATE_MODEM.PROCESS;
            } break;
            case "close": {
                _modem.modem.close();
                next_state = STATE_MODEM.START;
            } break;
            default: {
                console.log("IDLE_STATE: not support");
            }
        }
    }
}

class ProcessState {
    handle(cmd, data, _modem, cb, next_state){
        switch(cmd){
            case "sent": {
                next_state = STATE_MODEM.IDLE;
            } break;
            case "error": {
                next_state = STATE_MODEM.ERROR;
            } break;
            default: {
                console.log("PROCESS_STATE: not support");
            }
        }
    }
}
class ErrorState {
    handle(cmd, data, _modem, cb, next_state){
        switch(cmd){
            case "fixed": {
                next_state = STATE_MODEM.IDLE;
            } break;
            default: {
                console.log("ERROR_STATE: not support");
            }
        }
    }
}



class StateFactory {
    getState(state){
        switch(state){
            case STATE_MODEM.START: {
                return new StartState();
            }
            case STATE_MODEM.IDLE: {
                return new IdleState();
            }
            case STATE_MODEM.PROCESS: {
                return new ProcessState();
            }
            case STATE_MODEM.ERROR: {
                return new ErrorState();
            }
            default: {
                console.log("Not found state support");
                return {}
            }
        }
    }
}

class StateMachine {
    constructor(){
        this.state = STATE_MODEM.START;
        this.stateFactory = new StateFactory();
    }
    handle(cmd, data, modem, cb){
        state = this.stateFactory.getState();
        state.handle(cmd, data, modem, cb, this.state);
    }
}

class Modem {
    constructor(name){
        let that = this;
        this.path = ""
        this.name = name;
        this.stateMachine = new StateMachine();

        //composition
        this.modem = serialportgsm.Modem();
        this.modem.on("open", function(result){
            console.log("OPEN: ", result);
            that.idle();
        })
        this.modem.on("close", function(result){
            console.log("CLOSE: ", result);
            // that.idle();
        })
        this.modem.on("error", function(result){
            console.log("ERROR: ", result);
            // that.idle();
        })
        this.modem.on("onMessageSent", function(results){
            console.log("ON_MESSAGAGE_SENT: ", results);
            that.sent();
        })
        this.modem.on("onMessageSendingFailed", function(results){
            console.log("ON_MESSAGE_SENDING_FAILED: ", results);
            // that.idle();
        })
        this.modem.on("onSendingMessage", function(results){
            console.log("ON_SENDING_MESSAGE: ", results);
            // that.idle();
        })
    }
    
    handleRequest(state){
        state.handle(this);
    }
    stateObject(){
        return this.stateFacetory.getState(this.state);
    }
    start(){
        this.stateMachine.handle('open', {}, this, function(){

        })
        // var state = this.stateObject();
        // state.handle('open',{}, this);
    }
    sendSMS(phone, content){
        var state = this.stateObject();
        state.handle("sendSMS", {
            message: content,
            phone: phone
        }, this);
    }
    stop(){
        var state = this.stateObject();
        state.handle('close',{}, this);
    }
    sent(){
        var state = this.stateObject();
        state.handle('sent',{}, this);
    }
    error(){
        var state = this.stateObject();
        state.handle('error',{}, this);
    }
    idle(){
        this.stateMachine.handle('idle', {}, this);
        // var state = this.stateObject();
        // state.handle('idle',{}, this);
    }
    fixed(){
        var state = this.stateObject();
        state.handle('fixed',{}, this);
    }
}

STATE_MODEM = {
    START: 0,
    IDLE: 1,
    PROCESS: 2,
    ERROR: 3
}


class SMSGate {
    constructor(){
        this.path = "";
        this.modem = {};
        this.name = "";
        this.stateMachine = new StateMachine();
    }
    func(type){

    }
    set_feature(type, option){

    }
    get_info(type){

    }
    init(){

    }
    control(type){

    }
}
module.exports.Modem = Modem;