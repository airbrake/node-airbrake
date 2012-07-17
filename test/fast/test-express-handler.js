var express = require('express');
var app = express.createServer();
var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.key);
var assert = require('assert');
var sinon = require('sinon');
var http = require('http');

sinon.spy(airbrake, 'notify');

airbrake.dieOnError = false;

app.error(airbrake.expressHandler());
app.listen(common.port);

app.get('/caught', function(req, res, next) {
  var err = new Error('i am caught!');
  next(err);
})

app.get('/uncaught', function(req, res, next) {
  var err = new Error('i am uncaught!');
  throw err;
})


process.on('exit', function() {
  var exitCode = (airbrake.notify.called)
    ? 0
    : 1;

  process.reallyExit(exitCode)
});

http.request({port: common.port, path: '/caught'}, function() {
  http.request({port: common.port, path: '/uncaught'}, function () {
    process.exit()
  }).end();
}).end();
