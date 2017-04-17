var common = require('./common');
var airbrake = require(common.dir.root).createClient('1234', 'invalid', 'production');
var assert = require('assert');
var nock = require('nock');

nock.disableNetConnect();

var endpoint = nock('https://api.airbrake.io').
      post('/api/v3/projects/1234/notices?key=invalid').
      reply(401);

var myErr = new Error('test-notify');
airbrake.notify(myErr, function(err) {
  assert.ok(!!err, 'should receive an error object');
  assert.ok(/401/i.test(err.message));
  endpoint.done();
});
