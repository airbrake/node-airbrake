var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.key, common.env)
var sinon = require('sinon');
var assert = require('assert');

var err = new Error('A total different error');

airbrake.projectRoot = __dirname;
airbrake.appVersion = '1.0.0.';

var spy = sinon.spy();
airbrake.notify(err, spy);

process.on('exit', function() {
  assert.ok(spy.called);
  var err = spy.args[0][0];
  if (err) {
    throw err;
  }
});
