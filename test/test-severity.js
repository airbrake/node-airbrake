var common = require('./common');
var airbrake = require(common.dir.root).createClient(common.projectId, common.key);
var assert = require('assert');

(function testDefaultSeverity() {
  var err = new Error();
  var context = airbrake.contextJSON(err);

  assert.equal(context.severity, 'error');
}());

(function testCustomSeverity() {
  var customSeverity = 'critical';
  var err = new Error();
  err.severity = customSeverity;
  var context = airbrake.contextJSON(err);

  assert.equal(context.severity, customSeverity);
}());
