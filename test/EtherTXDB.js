let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB');

describe('EtherTxToDB',()=>{
    it('db find test',()=>{
        let Et = EtherTXDB;
        Et.find({}).select('blockNumber').sort({blockNumber:-1}).limit(1).exec(
            (err,b)=>{
            console.dir(err);
            console.dir(b[0].blockNumber);
        });
    })
});