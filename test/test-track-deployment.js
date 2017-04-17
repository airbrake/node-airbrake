var common = require('./common');
var Airbrake = require(common.dir.root);
var airbrake = Airbrake.createClient(common.projectId, common.key);
var sinon = require('sinon');
var assert = require('assert');
var execSync = require('child_process').execSync;
var nock = require('nock');

nock.disableNetConnect();

var endpoint = nock('https://api.airbrake.io').
      post('/api/v4/projects/' + common.projectId + '/deploys?key=' + common.key).
      reply(201);

var spy = sinon.spy();
airbrake.trackDeployment({}, spy);

process.on('exit', function() {
  assert.strictEqual(spy.args[0][0], null);
  assert.deepEqual(Object.keys(spy.args[0][1]), [
    'key',
    'env',
    'user',
    'rev',
    'repo'
  ]);

  var expectedRepo = execSync('git config --get remote.origin.url').toString().trim();
  assert.equal(spy.args[0][1].repo, expectedRepo);

  var expectedRev = execSync('git rev-parse HEAD').toString().trim();
  assert.equal(spy.args[0][1].rev, expectedRev);

  endpoint.done();
});
