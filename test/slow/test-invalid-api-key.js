return console.log('disabled - airbrake returns success codes for this now?');

var common = require('../common');
var airbrake = require(common.dir.root).createClient();
var assert = require('assert');

var myErr = new Error('test-notify');
airbrake.notify(myErr, function(err) {
  assert.ok(/api key/i.test(err.message));
});
