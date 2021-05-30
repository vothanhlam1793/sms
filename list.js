let serialportgsm = require('serialport-gsm')

serialportgsm.list((err, result) => {
    console.log(result)
})