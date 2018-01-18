let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB'),
    BadBlock = require('../services/badBlocks'),
    xhr = require('xmlhttprequest').XMLHttpRequest;
//    parallel = require('run-parallel'),
    Web3 = require('web3');
//const { fork } = require('child_process');

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
            //let net = require('net');
            //this.web3 = new Web3(new Web3.providers
            //    .IpcProvider('/home/mykola/.ethereum/testnet/geth.ipc',net));
        }
        return this.web3.isConnected();
    },
    realTimeScan:function(next){
        const self = this,
            opts = {};
        opts.span = 500;
        opts.spanScanInterval = 5;
        opts.realTimeErrorRescanTime = 5*60*1000;
        opts.realTimeRescanTime = 10*1000;
        self.opts = opts;
        EtherTXDB.find({}).select('blockNumber').sort({blockNumber:-1}).limit(1).exec((err,tx)=>{
                if(err || !tx) {
                    Log.error('DATABASE ERROR ' + err.message);
                    setTimeout(()=>{ self.realTimeScan(next) }, self.opts.realTimeErrorRescanTime);
                }
                else if(!self.connect())
                {
                    Log.error('Geth connection error!');
                    next(self.opts);
                } else {
                    self.opts.blockBegin = (tx.length && tx[0].blockNumber) ? tx[0].blockNumber : 0;
                    self.web3.eth.getBlock('latest', (err, latestBlock) => {
                        if(err || !latestBlock || !latestBlock.number)
                        {
                            Log.error('web3.eth.getBlock("latest") error');
                            setTimeout(()=>{ self.realTimeScan(next) }, self.opts.realTimeErrorRescanTime);
                        } else if(latestBlock.number - self.opts.blockBegin > self.opts.span) {
                            self.opts.blockEnd = latestBlock.number;
                            self.scanInterval(self.opts, () => {
                                self.realTimeScan(next);
                            })
                        } else {
                            const f = (opt)=>{
                                // console.log('Scaning interval ' + opt.realTimeRescanTime);
                                setTimeout(() => self.transactionsToDB(opt,f),
                                    opt.realTimeRescanTime)
                            };
                            f(self.opts);
                        }
                    });
                }
        })
    },
    scanInterval:function(opts,next){
        const self = this;
        opts = opts || {};
        opts.span = opts.span || 500;
        opts.spanScanInterval = opts.spanScanInterval || 5;
        opts.blockBegin = opts.blockBegin || 0;
        opts.blockEnd = opts.blockEnd || 0;
        self.opts = opts;
        const fn = (opts) => {
            Log.error(opts.k + ' ' + opts.blockEnd);
            if(opts.k < opts.blockEnd)
                setTimeout(()=>{
                    // console.log(opts.k);
                    if(opts.k + opts.span - 1 > opts.blockEnd)
                        self.transactionsToDBHistoryRPC(opts.k,opts.blockEnd,{},
                            ()=>{
                            opts.k = opts.blockEnd;
                            fn(opts)
                        });
                    else
                        self.transactionsToDBHistoryRPC(opts.k,opts.k + opts.span-1,{},
                            ()=>{
                            opts.k = opts.k + opts.span;
                            fn(opts)
                            })
                },opts.spanScanInterval);
            else {
                Log.log('Fill Database by scanInterval DONE          UUUUUUUUUUUUUUUUU');
                next();
            }
        };
        self.opts.k = self.opts.blockBegin;
        fn(self.opts);
    },
    transactionsToDB:function(opts, next){
        const self = this;
        self.opts = opts;
        self.opts = self.opts || {};
        self.opts.lastBlock = self.opts.lastBlock || 0;
        Log.log('Start transactionsToDB...');
        EtherTXDB.find({}).select('blockNumber').sort({blockNumber:-1}).limit(1).exec((err,tx)=>{
            if(err || !tx || !tx.length || !tx[0].blockNumber) {
                Log.error('DATABASE OR QUERY ERROR ' + err.message);
                next(self.opts);
            }
            else if(!self.connect())
                {
                    Log.error('Geth connection error!');
                    next(self.opts);
                }else{
                    self.web3.eth.getBlock('latest',(err,latestBlock)=>{
                        if(err || !latestBlock || !latestBlock.number)
                        {
                            Log.error('web3.eth.getBlock("latest") error');
                            next(self.opts);
                        }else
                        {
                            let bNum = tx[0].blockNumber + 1;
                            // Log.log('Block [' + latestBlock.number + ']');
                            if (err) {
                                Log.log('Web3.eth.getBlock error!');
                                next(self.opts);
                            }
                            else if (latestBlock.number > bNum && latestBlock.number > self.opts.lastBlock) {
                                Log.log('In ' + bNum + ' ' + latestBlock.number + ' ' + self.opts.lastBlock);
                                self.opts.lastBlock = latestBlock.number;
                                this.transactionsToDBHistoryRPC(bNum, latestBlock.number, self.opts, next);
                            }
                            else next(self.opts);
                        }
                    });
                }
        });

    },
    transactionsToDBHistory:function(finish,start,next) {
        Log.log(finish + ' Start...');
        //const txs = [];
        //let blockCount = 0;
        let badBlocks = [];
        const web3 = this.instWeb3();
        if (!web3) {
            Log.log('Geth NOT CONNECTED!    FINISH: '
                + finish + ' START: ' + start);
            this.transactionsToDBHistory(finish,start,next);
        }else if(finish >= start) next();
        else
            for (let i = finish; i <= start; i++)
                web3.eth.getBlock(i, true, (err, block) => {
                    if (err || !block)
                            badBlocks.push({blockNumber:i});
                    else if(!block.transactions.length) Log.log('Empty block ' + i);
                    else {
                        Log.log('Block N: ' + block.number);
                        let data = block.transactions.map(tx => {
                            tx.timestamp = block.timestamp;
                            return tx;
                        });
                        let up = (k, utx, callba) => {
                            if (k >= utx.length) callba();
                            else
                                EtherTXDB.update({hash: utx[k].hash}, utx[k], {upsert: true}, (err, t) => {
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
                       /* EtherTXDB.insertMany(data, (err, t) => {
                            if (err) console.log(err);
                            Log.log(i + ' FINISH !!!');
                        });*/
                    }
                    if (i === start)
                        if(badBlocks.length)
                            BadBlock.insertMany(badBlocks,(err,bb)=>{
                            if (err) Log.error('Bad Blocks don\'t save.');
                            else next();
                        });
                        else next();

                })

    },
    transactionsToDBHistoryRPC:function(finish,start,opts,next) {
        const self = this;
        self.opts = opts || {};
        Log.log(finish + ' Start...');
        //const txs = [];
        //let blockCount = 0;
        self.gethRPC('net_listening',[],(err,result)=>{
            if(!result || result.result !== true) {
                Log.error('GETH ERROR!');
                self.transactionsToDBHistoryRPC(finish,start,self.opts,next);
            }
            else{
                let badBlocks = [];
                if(finish >= start) next(self.opts);
                else
                    for (let i = finish; i <= start; i++)
                        self.gethRPC('eth_getBlockByNumber',['0x'+i.toString(16), true], (err, result) => {
                            //console.dir(result.result.transactions);
                            if (err || !result || !result.result || typeof(result.result) !== 'object' || typeof(result.result.transactions) !== 'object')
                                badBlocks.push({blockNumber:i});
                            else if(!result.result.transactions.length) Log.log('Empty block ' + i);
                            else {
                                Log.log('Block N: ' + i);
                                let data = result.result.transactions.map(tx => {
                                    tx.timestamp = result.result.timestamp;
                                    return tx;
                                });
                                EtherTXDB.insertMany(data, (err, t) => {
                                    if (err) console.log(err);
                                    Log.log(i + ' FINISH !!!');
                                });
                            }
                            if (i === start) {
                                self.opts.lastBlock = start;
                                if (badBlocks.length)
                                    BadBlock.insertMany(badBlocks, (err, bb) => {
                                        if (err) Log.error('Bad Blocks don\'t save.');
                                        next(self.opts);
                                    });
                                else next(self.opts);
                            }
                        })
            }
        });


    },
    rescanBadBlocks:function(next){
        BadBlock.find({},(err,bBlocks)=>{
            if(err || !bBlocks) Log.error('Database error.');
            else if(!bBlocks.length) Log.log('No bad blocks.');
                else {
                Log.log(finish + ' Start...');
                const web3 = this.instWeb3();
                const coll = EtherTXDB;
                if (!web3){
                    Log.log('Geth NOT CONNECTED!    FINISH: '
                        + finish + ' START: ' + start);
                    next();}
                else
                    for (let i = 0; i < bBlocks.length; i++)
                        web3.eth.getBlock(bBlocks[i].blockNumber, true, (err, block) => {
                            if (err || !block)
                                Log.error('Still bad block! ' + bBlocks[i].blockNumber);
                            else if(!block.transactions.length) Log.log('Empty block ' + bBlocks[i].blockNumber);
                                else {
                                    Log.log('Block N: ' + block.number);
                                    let data = block.transactions.map(tx => {
                                    tx.timestamp = block.timestamp;
                                    return tx;
                                });
                                EtherTXDB.insertMany(data, (err, t) => {
                                    if (err) Log.error('InsertMany ERROR!');
                                    else {
                                        BadBlock.remove({blockNumber:bBlocks[i].blockNumber},err=>{
                                            if(err) Log.error('Removing bad block ERROR! ' + bBlocks[i].blockNumber);
                                            else Log.log(bBlocks[i].blockNumber + ' FINISH !!!');
                                        });
                                    }
                                });
                            }
                            if (i === bBlocks.length - 1) next();

                        })
            }
        });
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
                EtherTXDB.find({blockNumber: i}, (err, txs) => {
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
                }, 0.01)
            }
        },
    gethRPC:function(method,params,next){
        const req = new xhr();
        req.open('POST', 'http://localhost:8545');
        req.onload = () => next(null,JSON.parse(req.responseText));
        req.onerror = (e) => next(e,null);
        req.send(JSON.stringify({"jsonrpc":"2.0","method":method,"params":params,"id":67}));
    }
};