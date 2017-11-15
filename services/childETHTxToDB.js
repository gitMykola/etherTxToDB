let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB'),
    //db = require('../services/db'),
    Web3 = require('web3');

process.on('message', (data) => {
    console.log('Message from parent:', data.message);
    console.log(data.ind + ' Finish ' + data.finishB + ' Start ' + data.startB);

    fillDB(data.finishB,data.startB,()=>{console.log('DONE '+ data.ind);
        });
});

let fillDB = (blockFinish, blockStart, next)=>{
    let web3 = null;
    if (web3 !== null) {
        web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }

    if(!web3.isConnected() || blockFinish === blockStart) next();
    else{
        web3.eth.getBlock(blockFinish, true,(err,block)=>{
            if(err || !block.transactions.length) {
                //Log.error('Empty block: ' + blockFinish);
                fillDB(++blockFinish,blockStart,next);
            }else if (blockFinish >= blockStart) next();
            else {
                let data = block.transactions.map(tx=>{
                    tx.timestamp = block.timestamp;return tx;});
                /*EtherTXDB.collection.insert(data,(err,ts)=>{
                    if(err)Log.error('ERROR insert block '+ block.number + err);
                    else {
                        //Log.log('Block: ' + block.number);
                        fillDB(++blockFinish,blockStart,next);}
                });*/
                let up = (k,utx,callba)=>{
                    if(k === utx.length)
                    {
                        //Log.log(block.number + ' CountTX: ' + k);
                        callba();
                    }
                    else
                        EtherTXDB.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                            if(err)Log.error('ERROR ' + err);
                            up(++k,utx,callba);
                        });
                };
                up(0,data,()=>fillDB(++blockFinish,blockStart,next));

            }

        });
    }
};