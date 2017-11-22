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
//let f = ()=>{setTimeout(()=>ETH.transactionsToDB(f),1000*10)};
//ETH.transactionsToDB(f);
//ETH.fillMegaFastDB(1999996,2000000,()=>console.log('Done!!!!!'));
//ETH.checkBlockTxCount(1900000,1910000,()=>console.log('DONE!!!!!!!'));
//ETH.transactionsToDBHistory_2_1(1999800,2000000,()=>console.log('Done!!!!!'));


// 1 700 000 - 1 900 000 / 1 356 277
// 1 900 000 - 2 110 000 / 1 862 291
// 1 300 000 - 1 700 000 / 3 101 345 (3 101 527)
//   900 000 - 1 300 000 / 4 828 576
//   500 000 -   900 000 /


const box = 500;
let f = (k)=>{
              if(k < 900000)
                setTimeout(()=>{
                  ETH.transactionsToDBHistory_2_4(k,k + box-1,
                    ()=>f(k + box))
                  },1000*0.01);
              else console.log('Done          UUUUUUUUUUUUUUUUU');
            };
const ks = 500000;
ETH.transactionsToDBHistory_2_4(ks,ks + box-1,
    ()=>f(ks + box));
module.exports = app;
