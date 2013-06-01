var common = require('../common');
var assert = require('assert');


(function testAddingKeyToDevelopmentEnvironments() {
  var airbrake = require(common.dir.root).createClient(common.key, 'dev');
  airbrake.developmentEnvironments.push('dev');
  airbrake.notify(new Error('this should not be posted to airbrake'), function(err, url) {
    assert.equal(err, undefined);
    assert.equal(url, undefined);
  });
})();

(function testDevelopmentEnviroment() {
  var airbrake = require(common.dir.root).createClient(common.key, 'dev');
  // this should be posted to airbrake simply because we didn't add 'dev' to
  // airbrake.developmentEnvironments. 
  airbrake.notify(new Error('this should be posted to airbrake'), function(err, url) {
    assert.equal(err, undefined);
    assert.ok(/^http:\/\//.test(url));
  });
})();


(function testProductionEnviroment() {
  var airbrake = require(common.dir.root).createClient(common.key, 'production');
  airbrake.notify(new Error('this should be posted to airbrake'), function(err, url) {
    assert.equal(err, undefined);
    assert.ok(/^http:\/\//.test(url));
  });
})();