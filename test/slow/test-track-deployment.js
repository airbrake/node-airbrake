var common = require('../common');
var Airbrake = require(common.dir.root);
var airbrake = Airbrake.createClient(null, common.key);
var sinon = require('sinon');
var assert = require('assert');
var execSync = require('sync-exec');

var spy = sinon.spy();
airbrake.trackDeployment({}, spy);

process.on('exit', function () {
  assert.strictEqual(spy.args[0][0], null);
  assert.deepEqual(Object.keys(spy.args[0][1]), [
    'key',
    'env',
    'user',
    'rev',
    'repo'
  ]);

  var expectedRepo = execSync('git config --get remote.origin.url')
    .stdout
    .toString()
    .slice(0, -1);

  var expectedRev = execSync('git rev-parse HEAD')
    .stdout
    .toString()
    .slice(0, -1);


  assert.equal(spy.args[0][1].repo, expectedRepo);
  assert.equal(spy.args[0][1].rev, expectedRev);
});
