var common = require('../common');
var airbrake = require(common.dir.root).createClient()
var assert = require('assert');
var sinon = require('sinon');

(function testNotifyForUnhandledExceptions() {
  sinon.stub(process, 'on');
  sinon.stub(airbrake, 'notify');

  airbrake.handleExceptions();

  var event = process.on.args[0][0];
  var handler = process.on.args[0][1];

  assert.equal(event, 'uncaughtException');

  assert.ok(!airbrake.notify.called);

  var err = new Error('i am uncaught!');
  handler(err);

  assert.ok(airbrake.notify.calledWith(err));

  var notifyCb = airbrake.notify.args[0][1];

  (function testNotifyOk() {
    sinon.stub(airbrake, 'log');
    sinon.stub(process, 'exit');

    notifyCb();

    assert.ok(/uncaught exception: airbreak was notified/i.test(airbrake.log.args[0][0]));
    assert.strictEqual(airbrake.log.args[1][0], err.stack);
    assert.ok(process.exit.calledWith(1));

    process.exit.restore();
    airbrake.log.restore();
  })();

  (function testNotifyError() {
    sinon.stub(airbrake, 'log');
    sinon.stub(process, 'exit');
    var notifyErr = new Error('notify error');

    notifyCb(notifyErr);

    assert.ok(/uncaught exception: could not notify airbreak/i.test(airbrake.log.args[0][0]));
    assert.strictEqual(airbrake.log.args[1][0], notifyErr.stack);
    assert.strictEqual(airbrake.log.args[2][0], err.stack);
    assert.ok(process.exit.calledWith(1));

    process.exit.restore();
  })();


  process.on.restore();
})();
