var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');
var Airbrake = require(common.dir.root);

function MyError() {
  var temp = Error.apply(this, arguments);
  temp.name = this.name = 'MyError';
  this.stack = temp.stack;
  this.message = temp.message;
}

MyError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: MyError
  }
});

(function testAddingExceptionToIgnoredExceptions() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'production');
  airbrake.ignoredExceptions.push(MyError);

  sinon.stub(airbrake, '_sendRequest');

  airbrake.notify(new MyError('this should not be posted to airbrake'));

  assert.ok(!airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
}());
