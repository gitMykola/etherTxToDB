let Log = require('../services/logToFile'),
    db = require('../services/db'),
    EtherTXDB = require('../services/EtherTXDB'),
    Web3 = require('web3');

module.exports = {
    web3: null,
    connect:function(){
        if (this.web3 !== null) {
            this.web3 = new Web3(this.web3.currentProvider);
        } else {
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        return this.web3.isConnected();
    },
    transactionsToDB:function(next){
        db.get('etherTransactions').find({},{sort:{blockNumber:-1},limit:1},(err,tx)=>{
            if(err) Log.log(err.message);
            else {
                if(!this.connect()) {Log.log('Geth connection error!');next();}
                else{
                    let web3 = this.web3;
                    web3.eth.getBlock('latest',(err,latestBlock)=>{
                        Log.log('Block [' + latestBlock.number + ']');
                        if(err){Log.log('Web3.eth.getBlock error!');next();}
                        else this.fillFastDB(tx[0].blockNumber,latestBlock.number,next);
                    });
                }
            }
        });

    },
    transactionToDBHistory:function(){

                if(!this.connect()) {Log.log('Geth connection error!');}
                else{
                    let web3 = this.web3;
                    web3.eth.getBlock('latest',(err,latestBlock)=>{
                        Log.log('Block [' + latestBlock.number + ']');
                        if(err){Log.log('Web3.eth.getBlock LAST BLOCK error!');}
                        else {
                            let func = (k,callback)=>{
                                setTimeout(()=> {
                                    if (k - 500 < 0) this.fillMegaFastDB(1, k, callback());
                                    else {
                                        this.fillMegaFastDB(k - 500, k, () => {
                                        Log.log('Block of block: ' + k);
                                        console.log('Block of block: ' + k);
                                        });
                                        func(k - 500,callback);
                                    }
                                },1000*20)
                            };
                            func(latestBlock.number,()=>{
                                Log.log('Done !!!!!!!!!!!!!!!!!!!!!!!');
                                console.log('Done !!!!!!!!!!!!!!!!!!!!!!!');
                            });
                        }//this.fillMegaFastDB(2034500,2035000,()=>console.log('done...'));
                    });
                }
    },
    fillDB:function(blockFinish,blockStart,next){
        let web3 = this.web3;
        web3.eth.getBlock(blockStart,(err,b)=>{
            if(err && blockStart > blockFinish) this.fillDB(blockFinish,
                (blockStart - 1),next);
            else if(blockFinish === blockStart) next();
            else {
                ftl = (txList, index, nx) => {
                    if (index === txList.length) nx();
                    else web3.eth.getTransaction(txList[index], (err, tx) => {
                        if (err) ftl(txList, ++index, nx);
                        else /*if(!tx.to)ftl(txList, ++index, nx);
                        else*/{
                            tx.timestamp = b.timestamp;
                            db.get('etherTransactions').update({
                                hash: tx.hash
                            },tx,{upsert:true},(err,t)=>{//console.dir(t);
                                Log.log('Block: '+ blockStart + ' TxN: '
                                    + index);
                                ftl(txList, ++index, nx);
                            })
                        }
                    })
                };
                ftl(b.transactions,0,()=>{
                    this.fillDB(blockFinish,(blockStart - 1), next)
                })
            }
        })
    },
    fillFastDB:function(blockFinish, blockStart, next){
        let web3 = this.web3;
        web3.eth.getBlockTransactionCount(blockStart,(err,txNumber)=>{
            if(err && blockStart > blockFinish || !txNumber) this.fillDB(blockFinish,
                (blockStart - 1),next);
            else if(blockFinish === blockStart) next();
            else {Log.log('Block ' + blockStart + ' TxNum ' + txNumber);
                let ftlf = (txNum, nx) => {
                    if (!txNum) nx();
                    else web3.eth.getTransactionFromBlock(blockStart,txNum, (err, tx) => {
                        //console.dir(blockStart);console.dir(tx);
                        if (err || !tx) ftlf((txNum - 1), nx);
                        else /*if(!tx.to)ftl(txList, ++index, nx);
                        else*/{
                            tx.timestamp = blockStart.timestamp;
                            /*db.get('etherTransactions')*/EtherTXDB.update({
                                hash: tx.hash
                            },tx,{upsert:true},(err,t)=>{//console.dir(t);
                                Log.log('Block: '+ blockStart + ' TxN: '
                                    + txNum);
                                ftlf((txNum - 1), nx);
                            })
                        }
                    })
                };
                ftlf(txNumber,()=>{
                    this.fillFastDB(blockFinish,(blockStart - 1), next)
                })
            }
        })
    },
    fillMegaFastDB:function(blockFinish, blockStart,next){
        let web3 = this.web3;
        for(let i = blockFinish;i < blockStart; i++){
            //Log.log(i);EtherTXDB.insertMany ([{from:"fuck"}],(e,r)=>console.log(e+r));
        web3.eth.getBlockTransactionCount(i,(err,txNumber)=>{//Log.log(i);
            if(err || !txNumber) {
                Log.error('Empty block: ' + i);
            }
            else web3.eth.getBlock(i,(err,b)=>{
                if(err) Log.error('Bad block: ' + i);
                    else{
                Log.log('Block ' + b.number + ' TxNum ' + txNumber);
                let ftlf = (txNum, nx) => {
                    if (!txNum) nx();
                    else web3.eth.getTransactionFromBlock(b.number,txNum, (err, tx) => {
                        //console.dir(blockStart);console.dir(tx);
                        if (err || !tx) ftlf((txNum - 1), nx);
                        else /*if(!tx.to)ftl(txList, ++index, nx);
                        else*/{
                            tx.timestamp = b.timestamp;
                            /*db.get('etherTransactions')*/EtherTXDB.update({
                                hash: tx.hash
                            },tx,{upsert:true},(err,t)=>{//Log.log(t.toString);
                                if(err)Log.error(err);
                                Log.log('Block: '+ b.number + ' TxN: '
                                    + txNum);
                                ftlf((txNum - 1), nx);
                            })
                        }
                    })
                };
                ftlf(txNumber,()=>{
                    Log.log('Done block: ' + b.number)
                })
            }
          })
        });
        }
        next();
    }
};