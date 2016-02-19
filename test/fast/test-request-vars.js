var common = require('../common');
var airbrake = require(common.dir.root).createClient()
var assert = require('assert');
var xmlbuilder = require('xmlbuilder');
var os = require('os');

(function testSettingCustomExclusions() {
  var err = new Error();
  err.domain = { id: 'identifier' };

  airbrake.exclude.push('domain');

  var cgiData = airbrake.cgiDataVars(err);
  assert(!cgiData['err.domain']);
})();

(function testCgiDataFromProcessEnv() {
  var err = new Error();
  var cgiData = airbrake.cgiDataVars(err);

  assert.equal(cgiData['process.pid'], process.pid);
  assert.equal(cgiData['process.uid'], process.getuid());
  assert.equal(cgiData['process.gid'], process.getgid());
  assert.equal(cgiData['process.cwd'], process.cwd());
  assert.equal(cgiData['process.execPath'], process.execPath);
  assert.equal(cgiData['process.version'], process.version);
  assert.equal(cgiData['process.argv'], process.argv);
  assert.ok(cgiData['process.memoryUsage'].rss);
  assert.equal(cgiData['os.loadavg'].length, 3);
  assert.equal(typeof cgiData['os.uptime'], 'number');
})();

(function testCustomErrorProperties() {
  var err = new Error();
  err.myKey = 'some value';

  var cgiData = airbrake.cgiDataVars(err);
  assert.equal(cgiData['err.myKey'], err.myKey);
})();

(function testWhitelistKeys(){
  var err = new Error();
  err.myKey = 'some value';

  airbrake.whiteListKeys.push("PWD");
  var cgiData = airbrake.cgiDataVars(err);
  assert.equal(typeof cgiData['PWD'], 'string');
  airbrake.whiteListKeys = [];
})();

(function testBlacklistKeys(){
  var err = new Error();
  err.myKey = 'some value';

  airbrake.blackListKeys.push("PWD");
  var cgiData = airbrake.cgiDataVars(err);
  assert.equal(typeof cgiData['PWD'], 'undefined');
  assert.equal(typeof cgiData['PATH'], 'string');
  airbrake.blackListKeys = []
})();

(function testSessionVars() {
  var err = new Error();
  err.session = {foo: 'bar'};

  var session = airbrake.sessionVars(err);
  assert.deepEqual(session, err.session);
})();

(function testParamsVars() {
  var err = new Error();
  err.params = {foo: 'bar'};

  var params = airbrake.paramsVars(err);
  assert.deepEqual(params, err.params);
})();

(function testCircularVars() {
  var vars = {foo: 'bar', circular: {}};
  vars.circular.self = vars.circular;

  // test that no exception is thrown
  var request = xmlbuilder.create().begin('request');
  airbrake.addRequestVars(request, 'params', vars);
})();

(function testAppendErrorXmlWithBadStack() {
  var notice = xmlbuilder.create().begin('notice');
  var err = new Error('oh oh');

  err.stack += '\n    at Array.0 (native)';
  airbrake.appendErrorXml(notice, err);
})();

(function testEmptyErrorMessageDoesNotProduceInvalidXml() {
  // see: https://github.com/felixge/node-airbrake/issues/15
  var err = new Error();
  var xml = airbrake.notifyXml(err, true);

  assert.ok(!/<\/>/.test(xml));
})();
