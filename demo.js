const serialportgsm = require('serialport-gsm');
const SERIAL = '/dev/tty.SLAB_USBtoUART';
var modem = serialportgsm.Modem()
var options = {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    xon: false,
    rtscts: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: 'AT^CURC=0',
    logger: console
}

modem.on('open', function(result){
    console.log(result);
    modem.sendSMS("0932032732", "Hello World", function(r){
        console.log(r);
    })
})

modem.on('onMessageSent', function(r){
    console.log(r);
})

modem.open(SERIAL, options);