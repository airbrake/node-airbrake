var semver = require('semver');

if (semver.gt(process.version, '4.0.0')) {
  /* eslint-disable global-require */
  var hapi = require('hapi');
  var common = require('../common');
  var airbrake = require(common.dir.root).createClient(null, common.key);
  var assert = require('assert');
  var sinon = require('sinon');
  var http = require('http');
  /* eslint-enable global-require */

  sinon.spy(airbrake, '_onError');

  var app = new hapi.Server({ debug: { request: ['error'] } });
  app.connection({ port: common.port });

  app.route({
    method: 'GET',
    path: '/uncaught',
    handler: function(request, _reply) {
      throw new Error('bingo');
    }
  });

  app.register(airbrake.hapiHandler(), function(err) {
    if (err) {
      throw err;
    }
  });

  app.start();

  http.request({
    port: common.port,
    path: '/uncaught',
    headers: {
      'User-Agent': 'bingo'
    }
  }, function() {
    var err = airbrake._onError.getCall(0);
    assert.equal(err.args[0].url, 'http://localhost:' + common.port + '/uncaught');
    assert.equal(err.args[0].ua, 'bingo');
    assert.equal(airbrake._onError.callCount, 1);
    process.exit();
  }).end();
}
