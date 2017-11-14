let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB'),
    mongoose = require('mongoose'),
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
        EtherTXDB.find({},{sort:{blockNumber:-1},limit:1},(err,tx)=>{
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
                                    if (k - 400 < 1998000) this.fillMegaFastDB(1, k, callback());
                                    else {
                                        this.fillMegaFastDB(k - 400, k, () => {
                                        Log.log('Block of block: ' + k);
                                        console.log('Block of block: ' + k);
                                        });
                                        func(k - 400,callback);
                                    }
                                },1000*15)
                            };
                            func(2000000,()=>{
                                Log.log('Done !!!!!!!!!!!!!!!!!!!!!!!');
                                console.log('Done !!!!!!!!!!!!!!!!!!!!!!!');
                            });
                        }//this.fillMegaFastDB(2034500,2035000,()=>console.log('done...'));
                    });
                }
    },
    transactionsToDBHistory_2_0:function(finish,start,next){
        let c = 5;
        let boxesCount = (start - finish) ? Math.floor((start - finish)/c) : 0,
            lastBox = (start - finish) % c;
        //let eth = [];
        if(boxesCount)
            for (let i = 0; i < c; i++) {
                //eth.push(new EtherTXDB());
                console.log((finish + i * boxesCount) + ' ' + (finish + (i + 1) * boxesCount));
                this.fillFastDB(new EtherTXDB(),
                                (finish + i * boxesCount),
                                (finish + (i + 1) * boxesCount),
                                () => console.log('Box ' + i + ' done.'));
                console.log(i);
            }
        console.log(lastBox + ' Last');
        if(lastBox)this.fillFastDB(new EtherTXDB(), c * boxesCount, c * boxesCount + lastBox, next);
        else next();
    },
    fillDB:function(etherTX,blockFinish,blockStart,next){
        if(!this.connect()){
            console.log('NOT CONNECTED!');
            next();
        }
        else {//console.log(blockStart + ' bl');
            let web3 = this.web3;
            web3.eth.getBlock(blockStart, (err, b) => {//console.log(b.number + ' bl');
                if (err && blockStart > blockFinish) this.fillDB(etherTX, blockFinish,
                    (blockStart - 1), next);
                else if (blockFinish === blockStart) next();
                else {
                    ftl = (txList, index, nx) => {
                        if (index === txList.length) nx();
                        else web3.eth.getTransaction(txList[index], (err, tx) => {
                            if (err) ftl(txList, ++index, nx);
                            else /*if(!tx.to)ftl(txList, ++index, nx);
                        else*/{
                                tx.timestamp = b.timestamp;
                                etherTX.update({
                                    hash: tx.hash
                                }, tx, {upsert: true}, (err, t) => {//console.dir(t);
                                    Log.log('Block: ' + blockStart + ' TxN: '
                                        + index);
                                    ftl(txList, ++index, nx);
                                })
                            }
                        })
                    };
                    ftl(b.transactions, 0, () => {
                        this.fillDB(etherTX, blockFinish, (blockStart - 1), next)
                    })
                }
            })
        }
    },
    fillFastDB:function(etherTX,blockFinish, blockStart, next){
        console.log(blockFinish + ' finish  -  ' + blockStart + ' start');
        this.connect();
        let web3 = this.web3;
        web3.eth.getBlockTransactionCount(blockStart,(err,txNumber)=>{
            if(err && blockStart > blockFinish || !txNumber) this.fillDB(etherTX,blockFinish,
                (blockStart - 1),next);
            else if(blockFinish === blockStart) next();
            else {Log.log('Block ' + blockStart + ' TxNum ' + txNumber);
                let ftlf = (txNum, nx) => {

                    if (!txNum) nx();
                    else web3.eth.getBlock(blockStart,(err,b)=>{
                        if(err){Log.error('Block ERROR ' + blockStart);nx();}
                        else web3.eth.getTransactionFromBlock(b, txNum, (err, tx) => {
                            //console.dir(blockStart);console.dir(tx);
                            if (err || !tx) ftlf((txNum - 1), nx);
                            else /*if(!tx.to)ftl(txList, ++index, nx);
                            else*/{
                                tx.timestamp = b.timestamp;
                                etherTX.update({
                                    hash: tx.hash
                                }, tx, {upsert: true}, (err, t) => {
                                    console.dir(err);
                                    Log.log('Block: ' + b.number + ' TxN: '
                                        + txNum);
                                    ftlf((txNum - 1), nx);
                                })
                            }
                        })
                    })
                };
                ftlf(txNumber,()=>{
                    this.fillFastDB(etherTX,blockFinish,(blockStart - 1), next)
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
                            let et = new EtherTXDB();
                            et.update({
                                hash: tx.hash
                            },tx,{upsert:true},(err)=>{//Log.log(t.toString);
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
    },
    checkBlockTxCount:function(blockFinish,blockStart,next){
        if(!this.connect()){
            console.log('NOT CONNECTED!');
            next();
        }
        else
        {
            let web3 = this.web3;
            let fun = (b, st, callback) => {
                let k = ((b + 500) > st) ? st : (b + 500);
                for (let i = b; i < k; i++) {//Log.log(b+' BLOCK');
                    EtherTXDB.find({blockNumber: i}, (err, txs) => {
                        //Log.log(b+' '+ txs.length);
                    if (err) console.log('Block ERROR: ' + i);
                    else {
                        web3.eth.getBlock(i,(err,bl)=>{
                            if(err)Log.error('Block error: ' + i );
                            else /*Log.log(i + '      ['+bl.transactions.length + '] '+
                            '   ['+txs.length + ']')*/
                                if (bl.transactions.length !== txs.length)
                                Log.error('ICORRECT BLOCK DATA RECORD: '
                                    + i + '/' + bl.number + ' '
                                + bl.transactions.length + ' ' + txs.length);
                            //else Log.log('Block OK '+ bl.number)
                        })
                    }
                });}
                if(k === blockStart) callback();
                else fun(k, st, callback);
            };
            fun(blockFinish, blockStart, next);
        }
    }
};