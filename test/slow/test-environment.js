var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.key);
var sinon = require('sinon');
var assert = require('assert');

// store original environment for later
var origEnv = process.env.NODE_ENV;

// throw an error in development
process.env.NODE_ENV = 'development';
var devErr = new Error('this error was thrown in development');
var devSpy = sinon.spy();
airbrake.notify(devErr, devSpy);

// throw an error in production
process.env.NODE_ENV = 'production';
var proErr = new Error('this error was thrown in production');
var proSpy = sinon.spy();
airbrake.notify(proErr, proSpy);

// restore original environment
process.env.NODE_ENV = origEnv;


process.on('exit', function() {
  // ensure that both callbacks wer called
  assert.ok(devSpy.called);
  assert.ok(proSpy.called);

  // check for errors
  var devErr = devSpy.args[0][0];
  if (devErr) {
    throw devErr;
  }

  var proErr = proSpy.args[0][0];
  if (proErr) {
    throw proErr;
  }

  // ensure that development returns callback without url
  var devUrl = devSpy.args[0][1];
  assert.equal(devUrl, undefined);

  // ensure that production returns callback with url
  var proUrl = proSpy.args[0][1];
  assert.ok(/^http:\/\//.test(proUrl));
});