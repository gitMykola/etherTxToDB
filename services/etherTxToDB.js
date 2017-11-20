let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB'),
    db = require('../services/db'),
    parallel = require('run-parallel'),
    Web3 = require('web3');

const { fork } = require('child_process');



module.exports = {
    web3: null,
    instWeb3:function(){
        if (this.web3 !== null) {
            this.web3 = new Web3(this.web3.currentProvider);
        } else {
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        return this.web3.isConnected()?this.web3:null;
    },
    connect:function(){
        if (this.web3 !== null) {
            this.web3 = new Web3(this.web3.currentProvider);
        } else {
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        return this.web3.isConnected();
    },
    transactionsToDB:function(next){
        EtherTXDB.find({}).select('blockNumber').sort({blockNumber:-1}).limit(1).exec((err,tx)=>{
            if(err) Log.error(err.message);
            else {

                if(!this.connect()) {Log.log('Geth connection error!');next();}
                else{
                    let web3 = this.web3;
                    web3.eth.getBlock('latest',(err,latestBlock)=>{
                        let bNum = tx[0]?tx[0].blockNumber:latestBlock.number - 1;
                        Log.log('Block [' + latestBlock.number + '] ' + tx.length);
                        if(err){Log.log('Web3.eth.getBlock error!');next();}
                        else if(latestBlock.number - bNum > 0) {
                            Log.log('In');
                            this.fillFastDB(bNum,latestBlock.number,next);
                        }
                            else next();
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
        let c = 50;
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
        if(lastBox)this.fillFastDB(db.get('ether_transactions'), c * boxesCount, c * boxesCount + lastBox, next);
        else next();
    },
    transactionsToDBHistory_2_1:function(finish,start,next){
        this.connect();
        if(!this.web3.isConnected()){console.log('Geth NOT CONNECTED!');next();}
        else {
            let c = 25;
            let boxesCount = (start - finish) ? Math.floor((start - finish) / c) : 0,
                lastBox = (start - finish) % c;
            let childETH = [];
            //let par = [];
            if (boxesCount)
                for (let i = 0; i < c; i++) {
                    //eth.push(new EtherTXDB());
                    childETH[i] = fork('/home/mykola/PhpstormProjects/etherTXToDB/services/childETHTxToDB');
                    childETH[i].send({
                        message:'Start child '+i,
                        ind:i,
                        finishB:finish + i * boxesCount,
                        startB:finish + (i + 1) * boxesCount,
                    });
                   // console.log((finish + i * boxesCount) + ' ' + (finish + (i + 1) * boxesCount));
                    /*par.push(
                                ()=>this.fillMegaFastDB((finish + i * boxesCount),
                                    (finish + (i + 1) * boxesCount),
                                    () => console.log('Box ' + i + ' done.'))
                            );*/
                    //console.log(i);
                }
            console.log(lastBox + ' Last');
            if (lastBox) /*par.push(
                                    ()=>this.fillMegaFastDB(c * boxesCount, c * boxesCount + lastBox, next)
                                );*/
            {
                let lastChild = fork('/home/mykola/PhpstormProjects/etherTXToDB/services/childETHTxToDB');
                lastChild.send({
                    message:'Start last child '+c,
                    ind:c,
                    finishB:c * boxesCount,
                    startB:c * boxesCount + lastBox,
                });
            }
            //else {}
            //parallel(par,next);
        }
        },
    transactionsToDBHistory_2_2:function(finish,start,next){
        this.connect();
        if(!this.web3.isConnected()){console.log('Geth NOT CONNECTED!');next();}
        else {
            let c = 50;
            let boxesCount = (start - finish) ? Math.floor((start - finish) / c) : 0,
                lastBox = (start - finish) % c;
            //let childETH = [];
            let coll = db.get('ether_transactions');
            let par = [];
            if (boxesCount)
                for (let i = 0; i < c; i++) {
                    //eth.push(new EtherTXDB());
                    /*childETH[i] = fork('/home/mykola/PhpstormProjects/etherTXToDB/services/childETHTxToDB');
                    childETH[i].send({
                        message:'Start child '+i,
                        ind:i,
                        finishB:finish + i * boxesCount,
                        startB:finish + (i + 1) * boxesCount,
                    });*/
                     console.log('Num: ' + i + '  ' + (finish + i * boxesCount) + ' ' + (finish + (i + 1) * boxesCount));
                    par.push(
                                ()=>this.fillMegaFastDB(i, coll,
                                    new Web3(new Web3.providers.HttpProvider('http://localhost:8545')),
                                    (finish + i * boxesCount),
                                    (finish + (i + 1) * boxesCount),
                                    () => console.log('Box ' + i + ' done.'))
                            );
                    //console.log(i);
                }
            console.log(lastBox + ' Last');
            if (lastBox) par.push(
                                    ()=>this.fillMegaFastDB(c, coll,
                                        new Web3(new Web3.providers.HttpProvider('http://localhost:8545')),
                                        c * boxesCount, c * boxesCount + lastBox, () => console.log('Box ' + c + ' done.'))
                                );
            /*{
                let lastChild = fork('/home/mykola/PhpstormProjects/etherTXToDB/services/childETHTxToDB');
                lastChild.send({
                    message:'Start last child '+c,
                    ind:c,
                    finishB:c * boxesCount,
                    startB:c * boxesCount + lastBox,
                });
            }*/
            //else {}
            parallel(par,next);
        }
    },
    transactionsToDBHistory_2_3:function(finish,start,next){
        const web3 = this.instWeb3();
        if(!web3 || finish >= start){console.log('Geth NOT CONNECTED!');next();}
        else {
            let coll = db.get('ether_transactions');
            /*this.fillDBVirtual(
                new Web3(new Web3.providers.HttpProvider('http://localhost:8545')),
                finish,
                start,
                [],
                (txs) => {
                    let up = (k,utx,callba)=>{
                        if(k >= utx.length)
                        {
                            //Log.log(block.number + ' CountTX: ' + k);
                            callba();
                        }
                        else
                            coll.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                                //Log.error(err + ' ' + JSON.stringify(t));
                                up(++k,utx,callba);
                            });
                    };
                    up(0,txs,next);
                    });*/
            let c = 50;
            let boxesCount = (start - finish) ? Math.floor((start - finish) / c) : 0,
                lastBox = (start - finish) % c;
            let par = [];
            if (boxesCount)
                for (let i = 0; i < c; i++) {
                    console.log('Num: ' + i + '  ' + (finish + i * boxesCount) + ' ' + (finish + (i + 1) * boxesCount));
                    par.push(
                        ()=>this.fillDBVirtual(
                            this.web3,//new Web3(new Web3.providers.HttpProvider('http://localhost:8545')),
                            (finish + i * boxesCount),
                            (finish + (i + 1) * boxesCount),
                            [],
                            (txs) => {
                                let up = (k,utx,callba)=>{
                                    if(k >= utx.length)
                                    {
                                        //Log.log(block.number + ' CountTX: ' + k);
                                        console.log('Box ' + i + ' done.');
                                        callba();
                                    }
                                    else
                                        coll.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                                            //Log.error(err + ' ' + JSON.stringify(t));
                                            up(++k,utx,callba);
                                        });
                                };
                                up(0,txs,next);
                            })
                    );
                }
            console.log(lastBox + ' Last');
            if (lastBox) par.push(
                ()=>this.fillDBVirtual(
                    this.web3,//new Web3(new Web3.providers.HttpProvider('http://localhost:8545')),
                    c * boxesCount,
                    c * boxesCount + lastBox,
                    [],
                    (txs) => {
                        let up = (k,utx,callba)=>{
                            if(k >= utx.length)
                            {
                                //Log.log(block.number + ' CountTX: ' + k);
                                console.log('Box ' + i + ' done.');
                                callba();
                            }
                            else
                                coll.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                                    //Log.error(err + ' ' + JSON.stringify(t));
                                    up(++k,utx,callba);
                                });
                        };
                        up(0,txs,next);
                    })
            );
            parallel(par,next);
        }
    },
    transactionsToDBHistory_2_4:function(finish,start,next) {
        Log.log(finish + ' Start...');
        //const txs = [];
        //let blockCount = 0;
        const web3 = this.instWeb3();
        const coll = db.get('ether_transactions');
        if (!web3 || finish >= start) {
            console.log('Geth NOT CONNECTED!');
            next();
        }
        else
            for (let i = finish; i <= start; i++)
                web3.eth.getBlock(i, true, (err, block) => {
                    if (err || !block.transactions.length) {
                        Log.error('Block error or empty: ' + i);
                    }
                    else {
                        Log.log('Block N: ' + block.number);
                        let data = block.transactions.map(tx => {
                            tx.timestamp = block.timestamp;
                            return tx;
                        });
                        let up = (k, utx, callba) => {
                            if (k >= utx.length) callba();
                            else
                                coll.update({hash: utx[k].hash}, utx[k], {upsert: true}, (err, t) => {
                                    if (err) console.log(err);
                                    up(++k, utx, callba);
                                });
                        };
                        up(0, data, () => {console.log(' test ' + i + ' ' + start);
                            if (i >= start) {
                                console.log(i + ' FINISH !!!');
                                Log.log(i + ' FINISH !!!');
                                //next();
                            } else console.log(i + ' Done.');
                        });

                    }
                    if (i >= start) next();

                })

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
    fillFastDB:function(blockFinish, blockStart, next){
        //let web3 = this.web3;
        let web3 = null;
        if (web3 !== null) {
            web3 = new Web3(this.web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        //console.log(blockFinish + ' finish  -  ' + blockStart + ' start ');
        web3.eth.getBlockTransactionCount(blockStart,(err,txNumber)=>{
            if(err && blockStart > blockFinish || !txNumber) {this.fillFastDB(blockFinish,
                (blockStart - 1),next);//console.log('Block ' + blockStart + ' f ' + blockFinish);
                //console.dir(err);
            }
            else if(blockFinish === blockStart) next();
            else {Log.log('Block ' + blockStart + ' TxNum ' + txNumber);
                let ftlf = (txNum, nx) => {

                    if (!txNum) nx();
                    else web3.eth.getBlock(blockStart,true,(err,b)=>{
                        if(err){Log.error('Block ERROR ' + blockStart);nx();}
                        else web3.eth.getTransactionFromBlock(b.number, txNum, (err, tx) => {
                            //console.dir(blockStart);console.dir(tx);
                            if (err || !tx) ftlf((txNum - 1), nx);
                            else /*if(!tx.to)ftl(txList, ++index, nx);
                            else*/{console.log('Block ' + b.number);
                                tx.timestamp = b.timestamp;
                                EtherTXDB.update({
                                    hash: tx.hash
                                }, tx, {upsert: true}, (err, t) => {
                                    //console.dir(err);console.dir(t);
                                    Log.log('Block: ' + b.number + ' TxN: '
                                        + txNum);
                                    ftlf((txNum - 1), nx);
                                })
                            }
                        })
                    })
                };
                ftlf(txNumber,()=>{
                    this.fillFastDB(blockFinish,(blockStart - 1), next)
                })
            }
        })
    },
    fillMegaFastDB:function(ind, dbe, web33, blockFinish, blockStart,next){
        if(!this.connect() || blockFinish === blockStart) next();
        else{
        //let web3 = this.web3;
        web33.eth.getBlock(blockFinish, true,(err,block)=>{
            if(err || !block.transactions.length) {
                //Log.error('Empty block: ' + blockFinish);
                this.fillMegaFastDB(ind, dbe, web33, ++blockFinish,blockStart,next);
            }
            else {
                let data = block.transactions.map(tx=>{
                    tx.timestamp = block.timestamp;return tx;});
                //let et = new EtherTXDB();
                let up = (k,utx,callba)=>{
                    if(k >= utx.length)
                    {
                        //Log.log(block.number + ' CountTX: ' + k);
                        callba();
                    }
                    else
                    dbe.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                        //Log.error(err + ' ' + JSON.stringify(t));
                        up(++k,utx,callba);
                        });
                    };
                up(0,data,()=>this.fillMegaFastDB(ind, dbe, web33,++blockFinish,blockStart,next));

            }

            });
        }
    },
    fillDBVirtual:function(blockFinish, blockStart, txs, next){
        if(!this.connect() || blockFinish >= blockStart) next(txs);
        else{
            let web3 = this.web3;
            web3.eth.getBlock(blockFinish, true,(err,block)=>{
                if(err || !block.transactions.length) {
                    //Log.error('Empty block: ' + blockFinish);
                    this.fillDBVirtual(++blockFinish,blockStart,txs,next);
                }
                else {
                    Log.log('Block N: ' + block.number);
                    let data = block.transactions.map(tx=>{
                        tx.timestamp = block.timestamp;return tx;});
                    this.fillDBVirtual(++blockFinish,blockStart,txs.concat(data),next);
                    //let et = new EtherTXDB();
                    /*let up = (k,utx,callba)=>{
                        if(k >= utx.length)
                        {
                            //Log.log(block.number + ' CountTX: ' + k);
                            callba();
                        }
                        else
                            dbe.update({hash:utx[k].hash},utx[k],{upsert:true},(err,t)=>{//Log.log(t.toString);
                                //Log.error(err + ' ' + JSON.stringify(t));
                                up(++k,utx,callba);
                            });
                    };
                    up(0,data,()=>this.fillMegaFastDB(ind, dbe, web33,++blockFinish,blockStart,next));
                    */
                }

            });
        }
    },
    checkBlockTxCount:function(blockFinish,blockStart,next) {
        if (!this.connect()) {
            console.log('NOT CONNECTED!');
            next();
        }
        else {
            let web3 = this.web3;
            for (let i = blockFinish; i <= blockStart; i++)
                setTimeout(()=>{
                Log.log(i + ' block checking...');
                db.get('ether_transactions').find({blockNumber: i}, (err, txs) => {
                    //Log.error(fn+' '+ txs.length);
                    if (err) Log.error('Block ERROR: ' + i);
                    else
                        web3.eth.getBlock(i, (err, bl) => {
                            if (err) Log.error('Block error: ' + i);
                            else if (bl.transactions.length !== txs.length)
                                Log.error('ICORRECT BLOCK DATA RECORD: '
                                    + i + '/' + bl.number + ' '
                                    + bl.transactions.length + ' ' + txs.length);
                            if (i === blockStart) {
                                Log.log(i + ' FINISH!!!');
                                next();
                            }
                        })
                });
                }, 0.5)
            }
        }
};