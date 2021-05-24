const serialportgsm = require('serialport-gsm');
const SERIAL = '/dev/ttyUSB0';
var gsmModem = serialportgsm.Modem()
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

gsmModem.open(SERIAL, options);
gsmModem.on('open', function(data){
    console.log(`Modem Sucessfully Opened`);
    gsmModem.initializeModem((msg, err) => {
        if(err){
            console.log("ERROR: Init");
            return;
        } else {
            console.log("SUCCESS: Init");
        }
        gsmModem.clo
    });
})
gsmModem.on('close', function(data){
    console.log(`Modem close`);
})