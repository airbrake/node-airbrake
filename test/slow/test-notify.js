var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.key, common.env)
var sinon = require('sinon');
var assert = require('assert');

var err = new Error('test-notify');
err.env = {protect: 'the environment!'};
err.session = {iKnow: 'what you did last minute'};

var circular = {};
circular.circular = circular;

err.params = {some: 'params', circular: circular};

airbrake.on('vars', function(type, vars) {
  delete vars.SECRET;
});

var spy = sinon.spy();
airbrake.notify(err, spy);

process.on('exit', function() {
  assert.ok(spy.called);
  var err = spy.args[0][0];
  if (err) {
    throw err;
  }
});
