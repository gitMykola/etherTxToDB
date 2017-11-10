let fs = require('fs');

module.exports = {
    log:function(message){
        fs.appendFile('./appLog.txt','\n'+ new Date() + '\n'+message,err=>{if(err)console.log(err)})
    },
    logTest:function(message){
        fs.appendFile('./appTestLog.txt','\n'+ new Date() + '\n'+message,err=>{if(err)console.log(err)})
    },
};