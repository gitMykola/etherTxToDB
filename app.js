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
let f = ()=>{setTimeout(()=>ETH.transactionsToDB(f),1000*10)};
//ETH.transactionsToDB(f);
//ETH.fillMegaFastDB(1999996,2000000,()=>console.log('Done!!!!!'));
ETH.checkBlockTxCount(1999800,2000000,()=>console.log('DONE!!!!!!!'));
//ETH.transactionsToDBHistory_2_1(1999800,2000000,()=>console.log('Done!!!!!'));
module.exports = app;
