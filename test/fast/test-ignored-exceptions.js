var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');

function MyError(){
  var temp = Error.apply(this, arguments);
  temp.name = this.name = 'MyError';
  this.stack = temp.stack;
  this.message = temp.message
}
MyError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: MyError
  }
});

(function testAddingExceptionToIgnoredExceptions() {
  var airbrake = require(common.dir.root).createClient(common.key, 'production');
  airbrake.ignoredExceptions.push(MyError);

  sinon.stub(airbrake, '_sendRequest');

  airbrake.notify(new MyError('this should not be posted to airbrake'));

  assert.ok(!airbrake._sendRequest.called);
  airbrake._sendRequest.restore();
})();
