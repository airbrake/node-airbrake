var common = require('../common');
var airbrake = require(common.dir.root).createClient()
var assert = require('assert');
var sinon = require('sinon');
var os = require('os');
var xmlbuilder = require('xmlbuilder');

(function testDefaultHost() {
  assert.equal(airbrake.host, 'https://' + os.hostname());
})();

(function testPlainHost() {
  var err = new Error('oh no');
  var url = airbrake.contextJSON(err)["url"];
  assert.equal(url, airbrake.host.toLowerCase() + "/");
})();

(function testPartialErrUrl() {
  var err = new Error('oh no');
  err.url = '/foo';
  var url = airbrake.contextJSON(err)["url"];

  assert.equal(url, airbrake.host.toLowerCase() + err.url);
})();

(function testAbsoluteErrUrl() {
  var err = new Error('oh no');
  err.url = 'http://example.org/bar';
  var url = airbrake.contextJSON(err)["url"];

  assert.equal(url, err.url);
})();
