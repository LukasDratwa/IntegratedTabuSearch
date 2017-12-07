var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');
var mongoose = require('mongoose');

var config = require('./config.json');

/*
    Database models
 */
require('./models/DataSet');
require('./models/OptimizationObjective');
require('./models/Parameter');
require('./models/Ratio');
require('./models/Vehicle');

// Connect Database
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://"+ config.db.username + ":" + config.db.password + "@" + config.server.host + "/" + config.db.name, { useMongoClient: true }, function(err) {
    if(err) {
        console.log("Failed to connect with database in --auth!");

        console.log("Connection to db without --auth");
        mongoose.connect("mongodb://" + config.server.host + "/" + config.db.name, { useMongoClient: true }, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Successfully connected with database");
            }
        });
    } else {
        console.log("Successfully connected with database");
    }
});



var index = require('./routes/index');
var dataupload = require('./routes/dataupload');
var restendpoints = require('./routes/restEndPoints');

// view engine setup
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use(dataupload);
app.use(restendpoints);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
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
  res.render('error');
});

axios.get("http://" + config.server.host + ":8080/checkdefaultparameters")
    .then(function(response){
        console.log("Status checkdefaultparameters: " , response.status);
    })
    .catch(function(err) {
        console.log(err);
    });

axios.get("http://" + config.server.host + ":8080/checkdefaultparametervalues")
    .then(function(response){
        console.log("Status checkdefaultparametervalues: " , response.status);
    })
    .catch(function(err) {
        console.log(err);
    });

/* Performing a POST request
axios.post('/save', { firstName: 'Marlon', lastName: 'Bernardes' })
    .then(function(response){
        console.log('saved successfully')
    });*/

module.exports = app;