var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');

var Airbrake = require(common.dir.root);

(function testProductionEnviroment() {
  var airbrake = Airbrake.createClient(null, common.key, 'production');
  sinon.stub(airbrake, '_sendRequest');

  airbrake.notify(new Error('this should be posted to airbrake'));

  assert.ok(airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
}());
