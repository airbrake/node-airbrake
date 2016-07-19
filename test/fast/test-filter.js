var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');

var Airbrake = require(common.dir.root);

(function testAddingFilter() {
  var airbrake = Airbrake.createClient(null, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  airbrake.addFilter(function(notice) {
    if (notice.errors[0].message === 'this should not be posted to airbrake') {
      return null;
    }

    return notice;
  });

  var spiedFunc = sinon.spy(function(notice) {
    var modifiedNotice = notice;

    modifiedNotice.context.version = '1.2.3';

    return modifiedNotice;
  });

  airbrake.addFilter(spiedFunc);

  airbrake.notify(new Error('this should not be posted to airbrake'));

  assert.ok(!airbrake._sendRequest.called);

  airbrake.notify(new Error('this should be posted to airbrake'));

  assert.ok(airbrake._sendRequest.called);

  // Second filter should only have been called 1x
  assert.ok(spiedFunc.calledOnce);

  assert.equal(spiedFunc.returnValues[0].context.version, '1.2.3');

  airbrake._sendRequest.restore();
}());
