// Tests for throwing undefined, ignore rule.
/* eslint no-throw-literal: 0 */
var common = require('../common');
var airbrake = require(common.dir.root).createClient(null, common.key);
var sinon = require('sinon');

airbrake.handleExceptions();

sinon.spy(airbrake, 'notify');

process.on('exit', function () {
  var exitCode = (airbrake.notify.called)
    ? 0
    : 1;

  process.reallyExit(exitCode);
});

throw undefined;
