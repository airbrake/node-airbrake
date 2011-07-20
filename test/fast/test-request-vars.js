var common = require('../common');
var airbrake = require(common.dir.root).createClient()
//var sinon = require('sinon');
var assert = require('assert');
var xmlbuilder = require('xmlbuilder');

(function testCgiDataFromProcessEnv() {
  var err = new Error();
  var cgiData = airbrake.cgiDataVars(err);
  assert.deepEqual(cgiData, process.env);
  assert.notStrictEqual(cgiData, process.env);
})();

(function testAddErrorEnv() {
  var err = new Error();
  err.env = {anEnvironmentPropertyTest: 'bar'};

  var cgiData = airbrake.cgiDataVars(err);
  assert.strictEqual(cgiData.anEnvironmentPropertyTest, 'bar');
  assert.strictEqual(Object.keys(cgiData).length, Object.keys(process.env).length + 1);
})();

(function testBadErrorEnv() {
  var err = new Error();
  err.env = true;

  var cgiData = airbrake.cgiDataVars(err);
  assert.deepEqual(cgiData, process.env);
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
  var request = xmlbuilder().begin('request');
  airbrake.addRequestVars(request, 'params', vars);
})();
