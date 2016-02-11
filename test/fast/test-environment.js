var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');

(function testAddingKeyToDevelopmentEnvironments() {
  var airbrake = require(common.dir.root).createClient(common.key, 'dev');
  airbrake.developmentEnvironments.push('dev');
  sinon.stub(airbrake, '_sendRequest');

  airbrake.notify(new Error('this should not be posted to airbrake'));

  assert.ok(!airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
})();

(function testDevelopmentEnviroment() {
  var airbrake = require(common.dir.root).createClient(common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  // this should be posted to airbrake simply because we didn't add 'dev' to
  // airbrake.developmentEnvironments.
  airbrake.notify(new Error('this should be posted to airbrake'));

  assert.ok(airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
})();

(function testProductionEnviroment() {
  var airbrake = require(common.dir.root).createClient(common.key, 'production');
  sinon.stub(airbrake, '_sendRequest');

  airbrake.notify(new Error('this should be posted to airbrake'));

  assert.ok(airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
})();
