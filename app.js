var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// figure out the root path and set it global
var path = require('path');
global.appRoot = path.resolve(__dirname);

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(__dirname + "/public"));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// format a YYYYMMDD string to a human friendly date
app.locals.prettyDate = function(d) {
    return d.substr(4,2)+"/"+d.substr(6,2)+"/"+d.substr(0,4);
}

// function to total up movie spend for a member
app.locals.totalMemberMovies = function(movies) {
    var total = 0;
    for (var i = 0; i < movies.length; i++) {
       total += parseInt(movies[i].bid); 
    }

    return total;
}

// simple function to return current yyyymmdd date
app.locals.ymd = function() {
    var date = new Date;
    var y = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString();
    var dd = date.getDate().toString();
    return parseInt(y + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]));
}

app.locals.h_num = function(number) {
    number = Math.round(Number(number));
    
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = app;
