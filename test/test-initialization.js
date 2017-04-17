var common = require('./common');
var assert = require('assert');
var Airbrake = require(common.dir.root);

(function testCreateClientWorks() {
  assert.doesNotThrow(function() {
    Airbrake.createClient(common.projectId, common.key);
  });
}());

(function testMissingKeyThrows() {
  assert.throws(function() {
    Airbrake.createClient(common.projectId);
  });
}());

(function testMissingProjectIdThrows() {
  assert.throws(function() {
    Airbrake.createClient(null, common.key);
  });
}());
