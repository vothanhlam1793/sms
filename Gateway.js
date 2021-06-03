var model = require("./db");
var MessageModel = model.MessageModel;

let serialportgsm = require('serialport-gsm')
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

class Gateway {
    constructor(path){
        this.path = path;
        this.modem = serialportgsm.Modem();
        this.state = "START";
    }
}