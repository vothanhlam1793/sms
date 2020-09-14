const serialportgsm = require('serialport-gsm');
const SERIAL = '/dev/tty.usbserial-141310';
var gsmModem = serialportgsm.Modem()
let options = {
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


let phone = {
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

                        // read the whole SIM card inbox
                        gsmModem.getSimInbox((result, err) => {
                            if (err) {
                                console.log(`Failed to get SimInbox ${err}`);
                            } else {
                                console.log(`Sim Inbox Result: ${JSON.stringify(result)}`);
                            }

                            // Finally send an SMS
                            // const message = `Ngon lành - hệ thống này có thể gởi được tin nhắn có số lượng kí tự lớn hay không?. Nhưng có vẻ nó đang tạo ra rất nhiều giới hạn mà chúng ta có thể vượt qua. Nếu nó ổn định, ta hoàn toàn có thể chăm sóc những thứ chúng ta thích nhất. Từ mã UTF8 nó tự động chuyển sang UTF16-BE. Tuyệt vời!.`;
                            // const message = `Xin chào hệ thống - tôi nhắn được tiếng Việt rồi nè :D`
                            // gsmModem.sendSMS(phone.number, message, false, (result) => {
                            //     console.log(`Callback Send: Message ID: ${result.data.messageId},` +
                            //         `${result.data.response} To: ${result.data.recipient} ${JSON.stringify(result)}`);
                            // });
                            // readySendMessage(cb);
                            if(cb){
                                cb();
                            }
                        });

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
            console.log(`Event Close: ` + JSON.stringify(data));
        });

    });

    gsmModem.open(SERIAL, options);
}


var checkError = true;
var runningSend = false;
var arraySms = [];
var tempModem = true;

function closeModem(){
    if(tempModem == true) {
        return;
    } else {
        tempModem = true;
    }
    setTimeout(() => {
        checkError = true;
        gsmModem.close(() => {

        });
    }, 20000);
}

function restartModem(){
    setTimeout(()=>{
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
                console.log("THANH CONG");
                sendArray();
            } else if (res == "Successfully Sent to Message Queue"){
                console.log("Doi mot xiu");
                if(waiting == true){

                } else {
                    waiting = true;
                    setTimeout(()=>{
                        sendArray();
                        waiting = false;
                    }, 5000);
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


function callbackData(cb, data){
    if(cb){
        cb(data);
    }
}

function elementSendSMS(p_data, cb){
    send(p_data.phone, p_data.content, cb);
}

function sendSMS(p_datas, cb){
    if(checkError == true){
        tempModem = false;
        startModem(function(){
            sendArray();
        });
        checkError = false;
    } 
    p_datas.forEach(function(e){
        arraySms.push(e);
    });
    if(cb){
        cb("RECV: " + p_datas.length);
    }
}

module.exports.sendSMS = sendSMS;