var mockery = require('mockery'),
  sinon = require('sinon'),
  common = require('../common'),
  assert = require('assert');

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
});

var requestStub = sinon.stub()

mockery.registerMock('request', requestStub);

var Airbrake = require(common.dir.root);
var airbrake = Airbrake.createClient(common.key, null, 'production');
airbrake.requestOptions = {
  myCustomOption: 'myCustomValue',
  method: 'GET'
};

airbrake.notify(new Error('the error'), function() {});

assert(requestStub.calledWith(
  sinon.match.has('myCustomOption', 'myCustomValue').and(
    sinon.match.has('method', 'GET')
  )
));

requestStub.reset();

airbrake.requestOptions = {
  myCustomOption2: 'myCustomValue2',
  method: 'DELETE'
};

airbrake.trackDeployment({
  repo: Airbrake.PACKAGE.repository.url,
  rev: '98103a8fa850d5eaf3666e419d8a0a93e535b1b2',
}, function() {});

assert(requestStub.calledWith(
  sinon.match.has('myCustomOption2', 'myCustomValue2').and(
    sinon.match.has('method', 'DELETE')
  )
));
