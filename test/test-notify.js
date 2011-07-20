var common = require('./common');
var airbrake = require(common.dir.root).createClient(common.key, common.env)
var sinon = require('sinon');
var assert = require('assert');

var err = new Error('test-notify');

err.url = 'super';
err.action = 'hot_action';
err.component = 'coolio';

var spy = sinon.spy();
airbrake.notify(err, spy);

process.on('exit', function() {
  assert.ok(spy.called);
  var err = spy.args[0][0];
  if (err) {
    throw err;
  }
});
