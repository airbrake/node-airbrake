var common = require('./common');
var airbrake = require(common.dir.root).createClient(common.projectId, common.key, 'production');
var sinon = require('sinon');
var assert = require('assert');
var nock = require('nock');

nock.disableNetConnect();

var err = new Error('Node.js just totally exploded on me');
err.env = { protect: 'the environment!' };
err.session = { iKnow: 'what you did last minute' };
err.url = 'http://example.org/bad-url';

var circular = {};
circular.circular = circular;

err.params = { some: 'params', circular: circular };

airbrake.on('vars', function(type, vars) {
  /* eslint no-param-reassign: 0 */
  delete vars.SECRET;
});

var spy = sinon.spy();
var endpoint = nock('https://api.airbrake.io').
      post('/api/v3/projects/' + common.projectId + '/notices?key=' + common.key).
      reply(201, '{"url":"https://airbrake.io/locate/123"}');

airbrake.notify(err, spy);

process.on('exit', function() {
  assert.ok(spy.called);
  endpoint.done();

  var error = spy.args[0][0];
  if (error) {
    throw error;
  }

  var url = spy.args[0][1];
  assert.ok(/^https?:\/\//.test(url));
});
