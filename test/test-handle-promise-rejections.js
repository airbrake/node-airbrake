var common = require('./common');
var airbrake = require(common.dir.root).createClient(common.projectId, common.key);
var assert = require('assert');
var sinon = require('sinon');

(function testNotifyForUnhandlePromiseRejections() {
  sinon.stub(process, 'on');
  sinon.stub(airbrake, 'notify');
  sinon.stub(airbrake, 'log');

  airbrake.handlePromiseRejections();

  var event = process.on.args[0][0];
  var handler = process.on.args[0][1];

  assert.equal(event, 'unhandledRejection');

  assert.ok(!airbrake.notify.called);

  var err = new Error('i am uncaught!');
  handler(err);

  assert.ok(airbrake.notify.calledWith(err));
  assert.ok(airbrake.log.calledWith('Airbrake: Uncaught exception, sending notification for:'));
  assert.ok(airbrake.log.calledWith(err.stack));

  airbrake.log.restore();

  var notifyCb = airbrake.notify.args[0][1];

  (function testNotifyOk() {
    sinon.stub(airbrake, 'log');
    sinon.stub(process, 'exit');

    notifyCb();

    assert.ok(/notified service/i.test(airbrake.log.args[0][0]));
    assert.ok(process.exit.calledWith(1));

    process.exit.restore();
    airbrake.log.restore();
  }());

  (function testNotifyError() {
    sinon.stub(airbrake, 'log');
    sinon.stub(process, 'exit');
    var notifyErr = new Error('notify error');

    notifyCb(notifyErr);

    assert.ok(/could not notify service/i.test(airbrake.log.args[0][0]));
    assert.strictEqual(airbrake.log.args[1][0], notifyErr.stack);
    assert.ok(process.exit.calledWith(1));

    process.exit.restore();
  }());

  airbrake.log.restore();
  airbrake.notify.restore();
  process.on.restore();
}());

(function testDoNotKillProcessAfterUnhandlePromiseRejections() {
  sinon.stub(process, 'on');
  sinon.stub(airbrake, 'notify');
  sinon.stub(airbrake, 'log');
  sinon.stub(process, 'exit');

  airbrake.handlePromiseRejections(false);

  var handler = process.on.args[0][1];

  var err = new Error('i am uncaught!');
  handler(err);

  assert.ok(!process.exit.calledWith(1));

  process.exit.restore();
  airbrake.log.restore();
  airbrake.notify.restore();
  process.on.restore();
}());
