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
//let f = ()=>{setTimeout(()=>ETH.transactionsToDB(f),1000*10)};
//ETH.transactionsToDB(f);

/*****************************************
 * DATABASE CHECKING FOR ACTUAL TXs
 */

//ETH.checkBlockTxCount(1900000,1910000,()=>console.log('DONE!!!!!!!'));

/*********************************************
 * DATABASE FILLING FROM BLOCKCHAIN START
 */

const box = 50;
let fn = (k)=>{
              if(k < 2126000)
                setTimeout(()=>{
                  ETH.transactionsToDBHistory(k,k + box-1,
                    ()=>fn(k + box))
                  },1000*0.01);
              else {
                  Log.log('Done          UUUUUUUUUUUUUUUUU');
                  console.log('Done          UUUUUUUUUUUUUUUUU');
              }
            };
const ks = 0;
ETH.transactionsToDBHistory(ks,ks + box-1,
    ()=>fn(ks + box));

/*******************************************
 * RESCAN BAD BLOCKS
 * */
ETH.rescanBadBlocks(Log.log('Rescan bad blocks FINISH!!!!!!!'));

module.exports = app;
