let fs = require('fs');

module.exports = {
    log:function(message){
        fs.appendFile('./appLog.txt','\n'+ new Date() + '\t'+message,err=>{if(err)console.log(err)})
    },
    error:function(error){
        fs.appendFile('./appError.txt','\n'+ new Date() + '\t'+error,err=>{if(err)console.log(err)})
    },
    logTest:function(message){
        fs.appendFile('./appTestLog.txt','\n'+ new Date() + '\t'+message,err=>{if(err)console.log(err)})
    },
    badBlock:function(message){
        fs.appendFile('./badBlocks.txt', message + '\n', err => {if(err)console.log(err)})
    },
    doubleWrite:function(message){
        fs.appendFile('./doubleWriteBlocks.txt', message + '\n', err => {if(err)console.log(err)})
    }
};