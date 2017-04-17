// Tests for throwing undefined, ignore rule.
/* eslint no-throw-literal: 0 */
var common = require('./common');
var airbrake = require(common.dir.root).createClient(common.projectId, common.key);
var sinon = require('sinon');
var nock = require('nock');

nock.disableNetConnect();

var endpoint = nock('https://api.airbrake.io').
      post('/api/v3/projects/' + common.projectId + '/notices?key=' + common.key).
      reply(201, '{"url":"https://airbrake.io/locate/123"}');

airbrake.handleExceptions();

sinon.spy(airbrake, 'notify');

process.on('exit', function() {
  var exitCode = (airbrake.notify.called)
    ? 0
    : 1;
  endpoint.done();

  process.reallyExit(exitCode);
});

throw undefined;
