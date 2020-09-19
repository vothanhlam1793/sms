const serialportgsm = require('serialport-gsm');
const SERIAL = '/dev/tty.usbserial-142310';
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


var phone = {
    name: "My-Name",
    number: "+84932032732",
    numberSelf: "+49XXXXXX",
    mode: "PDU"
}

function startModem(cb) {
    // Port is opened
    gsmModem.on('open', () => {
        console.log(`Modem Sucessfully Opened`);

        // now we initialize the GSM Modem
        gsmModem.initializeModem((msg, err) => {
            if (err) {
                console.log(`Error Initializing Modem - ${err}`);
            } else {
                console.log(`InitModemResponse: ${JSON.stringify(msg)}`);

                console.log(`Configuring Modem for Mode: ${phone.mode}`);
                // set mode to PDU mode to handle SMS
                gsmModem.setModemMode((msg, err) => {
                    if (err) {
                        console.log(`Error Setting Modem Mode - ${err}`);
                    } else {
                        console.log(`Set Mode: ${JSON.stringify(msg)}`);

                        // get the Network signal strength
                        gsmModem.getNetworkSignal((result, err) => {
                            if (err) {
                                console.log(`Error retrieving Signal Strength - ${err}`);
                            } else {
                                console.log(`Signal Strength: ${JSON.stringify(result)}`);
                            }
                        });

                        // get Modem Serial Number
                        gsmModem.getModemSerial((result, err) => {
                            if (err) {
                                console.log(`Error retrieving ModemSerial - ${err}`);
                            } else {
                                console.log(`Modem Serial: ${JSON.stringify(result)}`);
                            }
                        });

                        // get the Own Number of the Modem
                        gsmModem.getOwnNumber((result, err) => {
                            if (err) {
                                console.log(`Error retrieving own Number - ${err}`);
                            } else {
                                console.log(`Own number: ${JSON.stringify(result)}`);
                            }
                        });

                        // execute a custom command - one line response normally is handled automatically
                        gsmModem.executeCommand('AT^GETPORTMODE', (result, err) => {
                            if (err) {
                                console.log(`Error - ${err}`);
                            } else {
                                console.log(`Result ${JSON.stringify(result)}`);
                            }
                        });

                        // execute a complex custom command - multi line responses needs own parsing logic
                        const commandParser = gsmModem.executeCommand('AT^SETPORT=?', (result, err) => {
                            if (err) {
                                console.log(`Error - ${err}`);
                            } else {
                                console.log(`Result ${JSON.stringify(result)}`);
                            }
                        });
                        const portList = {};
                        commandParser.logic = (dataLine) => {
                            if (dataLine.startsWith('^SETPORT:')) {
                                const arr = dataLine.split(':');
                                portList[arr[1]] = arr[2].trim();
                            } else if (dataLine.includes('OK')) {
                                return {
                                    resultData: {
                                        status: 'success',
                                        request: 'executeCommand',
                                        data: {
                                            'result': portList
                                        }
                                    },
                                    returnResult: true
                                }
                            } else if (dataLine.includes('ERROR') || dataLine.includes('COMMAND NOT SUPPORT')) {
                                return {
                                    resultData: {
                                        status: 'ERROR',
                                        request: 'executeCommand',
                                        data: `Execute Command returned Error: ${dataLine}`
                                    },
                                    returnResult: true
                                }
                            }
                        };
                    }
                }, phone.mode);

                // get info about stored Messages on SIM card
                gsmModem.checkSimMemory((result, err) => {
                    if (err) {
                        console.log(`Failed to get SimMemory ${err}`);
                    } else {
                        console.log(`Sim Memory Result: ${JSON.stringify(result)}`);
                        if(cb){
                            cb();
                        }
                    }
                });

            }
        });

        gsmModem.on('onNewMessageIndicator', data => {
            //indicator for new message only (sender, timeSent)
            console.log(`Event New Message Indication: ` + JSON.stringify(data));
        });

        gsmModem.on('onNewMessage', data => {
            //whole message data
            console.log(`Event New Message: ` + JSON.stringify(data));
        });

        gsmModem.on('onSendingMessage', data => {
            //whole message data
            console.log(`Event Sending Message: ` + JSON.stringify(data));
        });

        gsmModem.on('onNewIncomingCall', data => {
            //whole message data
            console.log(`Event Incoming Call: ` + JSON.stringify(data));
        });

        gsmModem.on('onMemoryFull', data => {
            //whole message data
            console.log(`Event Memory Full: ` + JSON.stringify(data));
        });

        gsmModem.on('close', data => {
            //whole message data
            SYSTEM = "STOP"
            console.log(`Event Close: ` + JSON.stringify(data));
        });

    });

    gsmModem.open(SERIAL, options);
}


var checkError = true;
var arraySms = [];
var tempModem = true;
var timeout_close = 0;
var timeout_restart = 0;

function stopTimeout(){
    clearTimeout(timeout_close);
    clearTimeout(timeout_restart);
    timeout_close = 0;
    timeout_restart = 0;
    tempModem = false;
}
function closeModem(){
    if(tempModem == true) {
        return;
    } else {
        tempModem = true;
    }
    clearTimeout();
    timeout_close = setTimeout(() => {
        checkError = true;
        gsmModem.close(() => {

        });
    }, 90000);
}

function restartModem(){
    clearTimeout();
    timeout_restart = setTimeout(()=>{
        checkError = true;
        gsmModem.close(() => {
            sendSMS([]);
        });
    }, 20000)
}

function send(number, message, cb){
    const message1 = message
    gsmModem.sendSMS(number, message1, false, (result) => {
        console.log(`Callback Send: Message ID: ${result.data.messageId},` +
            `${result.data.response} To: ${result.data.recipient} ${JSON.stringify(result)}`);
        if(cb){
            cb(result.data.response);
        }
    });
}

var waiting = false;
function sendArray(){
    var p_data = arraySms.pop();
    console.log("KIEM TRA: ", p_data);
    if(p_data == undefined){
        closeModem();
    } else {
        send(p_data.phone, p_data.content, function(res){
            if(res == "Message Successfully Sent") {
                stopTimeout();
                console.log("THANH CONG");
                sendArray();
            } else if (res == "Successfully Sent to Message Queue"){
                console.log("Doi mot xiu");
                stopTimeout();
                if(waiting == true){

                } else {
                    waiting = true;
                    setTimeout(()=>{
                        sendArray();
                        waiting = false;
                    }, 10000);
                }
            } else {
                console.log("That bai");
                //Co the goi lai
                arraySms.push(p_data);
                restartModem();
            }
        });
    }
}

function sendSMS(p_datas, cb){
    if(checkError == true){
        clearTimeout();
        tempModem = false;
        startModem(function(){
            sendArray();
        });
        checkError = false;
    }
    console.log("ARRAY:", arraySms.length);
    console.log("ERROR:", checkError);
    console.log("TIMOUT:", timeout_close);
    console.log("TYPEOF:", typeof timeout_close)
    p_datas.forEach(function(e){
        arraySms.push(e);
    });
    if((checkError == false) && (typeof timeout_close == "object") && (arraySms.length == p_datas.length)){
        clearTimeout();
        sendArray();
    }
    if(cb){
        cb("RECV: " + p_datas.length);
    }
}

var SYSTEM = "STOP";
function start(cb){
    if((SYSTEM == "START") || (SYSTEM == "STARTING")){
        if(cb){
            cb(SYSTEM);
        }
        return SYSTEM;
    } else {
        SYSTEM = "STARTING";
        startModem(function(){
            if(cb){
                SYSTEM = "START";
                cb("SUCCESS");
            }
        })
        return "OK";
    }
}

function stop(cb){
    if((SYSTEM == "STOP") || (SYSTEM == "STOPPING")){
        if(cb){
            cb(SYSTEM);
        }
        return SYSTEM;
    } else if (SYSTEM == "START") {
        SYSTEM = "STOPPING";
        gsmModem.close(() => {
            if(cb){
                cb("SUCCEES");
            }
        });
        return "OK";
    } else {
        if(cb){
            cb("ERROR: Cannot stop when starting");
        }
        return "ERROR";
    }
}

var ACTION = "IDLE";
function sms(obj, cb){
    if((SYSTEM == "START") && (ACTION == "IDLE")){
        ACTION = "SENDING";
        gsmModem.sendSMS(obj.number, obj.message, false, (result) => {
            if(result.data.response == "Message Successfully Sent"){
                ACTION = "IDLE";
                if(cb){
                    cb("SUCCESS");
                }
            } else {

            }
        });
        return "OK";
    } else if ((SYSTEM == "STOP") || (SYSTEM == "STOPPING")){
        return "ERROR";
    } else {
        return "WAITING";
    }
}
module.exports.sendSMS = sendSMS;
module.exports.start = start;
module.exports.stop = stop;
module.exports.send = sms;