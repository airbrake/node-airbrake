var common = require('./common');
var assert = require('assert');
var sinon = require('sinon');

var Airbrake = require(common.dir.root);

(function testAddFilterFiresOnce() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  var filter = sinon.spy(function(notice) { return notice; });
  airbrake.addFilter(filter);

  airbrake.notify(new Error('bingo'));
  assert.ok(airbrake._sendRequest.called);
  assert.ok(filter.calledOnce);

  airbrake._sendRequest.restore();
}());

(function testAddFilterModifiesNotice() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  var filter = sinon.spy(function(notice) {
    var modifiedNotice = notice;
    modifiedNotice.context.version = '1.2.3';
    return modifiedNotice;
  });

  airbrake.addFilter(filter);

  airbrake.notify(new Error('bingo'));
  assert.ok(airbrake._sendRequest.called);
  assert.equal(filter.returnValues[0].context.version, '1.2.3');

  airbrake._sendRequest.restore();
}());

(function testAddFilterIgnoresNotices() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  airbrake.addFilter(function(_notice) { return null; });
  airbrake.notify(new Error('bingo'));
  assert.ok(!airbrake._sendRequest.called);
}());

(function testAddFilterStartsExecutionFromOldestFilter() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  var nums = [];
  var filterFunc = function(i) {
    return function(notice) {
      nums.push(i);
      return notice;
    };
  };
  for (var i = 0; i < 3; i++) {
    airbrake.addFilter(filterFunc(i));
  }

  airbrake.notify(new Error('bingo'));
  assert.ok(airbrake._sendRequest.called);
  assert.deepEqual(nums, [0, 1, 2]);

  airbrake._sendRequest.restore();
}());

(function testAddFilterStartsExecutionFromOldestFilterButStopsIfShouldIgnore() {
  var airbrake = Airbrake.createClient(common.projectId, common.key, 'dev');
  sinon.stub(airbrake, '_sendRequest');

  var nums = [];
  var filterFunc = function(i) {
    return function(notice) {
      if (i === 3) {
        return null;
      }

      nums.push(i);
      return notice;
    };
  };
  for (var i = 0; i < 5; i++) {
    airbrake.addFilter(filterFunc(i));
  }

  airbrake.notify(new Error('bingo'));
  assert.ok(!airbrake._sendRequest.called);
  assert.deepEqual(nums, [0, 1, 2]);

  airbrake._sendRequest.restore();
}());
