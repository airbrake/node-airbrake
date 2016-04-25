var express = require('express');
var app = express();
var common = require('../common');
var airbrake = require(common.dir.root).createClient(null, common.key);
var assert = require('assert');
var sinon = require('sinon');
var http = require('http');

sinon.spy(airbrake, '_onError');

app.listen(common.port);

app.get('/caught', function (req, res, next) {
  var err = new Error('i am caught!');
  next(err);
});

app.get('/uncaught', function () {
  // This actually gets handled by app.error() as well, express will catch
  // this one for us.
  var err = new Error('i am quasi uncaught!');
  throw err;
});

app.use(airbrake.expressHandler());

http.request({
  port: common.port,
  path: '/caught',
  headers: {
    'User-Agent': 'foo'
  }
}, function () {
  assert.equal(airbrake._onError.getCall(0).args[0].ua, 'foo');
  assert.equal(airbrake._onError.callCount, 1);
  http.request({
    port: common.port,
    path: '/uncaught'
  }, function () {
    assert.equal(airbrake._onError.callCount, 2);
    process.exit();
  }).end();
}).end();
