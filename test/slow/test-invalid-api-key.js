var common = require('../common');
var airbrake = require(common.dir.root).createClient('invalidkey', null, 'production');
var assert = require('assert');

var myErr = new Error('test-notify');
airbrake.notify(myErr, function(err) {
  assert.ok(!!err, 'should receive an error object')
  assert.ok(/400/i.test(err.message));
});
