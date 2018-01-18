let express = require('express'),
    path = require('path'),
    //favicon = require('serve-favicon'),
    logger = require('morgan'),
    Log = require('./services/logToFile'),
    app = express(),
    ETH = require('./services/etherTxToDB');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  Log.log('Error: ' + err.message);
});

/*******************************
* REAL TIME ETHERNET SCANNING
*/
let f = (opts)=>{setTimeout(()=>ETH.transactionsToDB(opts,f),1000*10)};
//ETH.transactionsToDB({lastBlock:2472330},f);

/*****************************************
 * DATABASE CHECKING FOR ACTUAL TXs
 */

//ETH.checkBlockTxCount(1900000,1910000,()=>console.log('DONE!!!!!!!'));

/*********************************************
 * DATABASE FILLING FROM BLOCKCHAIN START
 */

const box = 500,
    ks = 2470000,
    kf = 2474418;
let fn = (k)=>{
              if(k < kf)
                setTimeout(()=>{
                  if(k + box-1 > kf)
                      ETH.transactionsToDBHistoryRPC(k,kf,{},
                          ()=>fn(kf));
                     else
                          ETH.transactionsToDBHistoryRPC(k,k + box-1,{},
                            ()=>fn(k + box))
                },1000*0.005);
              else {
                  Log.log('Done          UUUUUUUUUUUUUUUUU');
                  console.log('Done          UUUUUUUUUUUUUUUUU');
              }
            };
ETH.transactionsToDBHistoryRPC(ks,ks + box-1,{lastBlock:2474418},
    ()=>fn(ks + box));

/*******************************************
 * RESCAN BAD BLOCKS
 * */
//ETH.rescanBadBlocks(Log.log('Rescan bad blocks FINISH!!!!!!!'));

module.exports = app;
