var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.projectId, common.key, 'production');
var assert = require('assert');
var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(500);
  res.end('something went wrong');
});

server.listen(common.port, function() {
  var testNotifyError = new Error('test-notify');
  airbrake.serviceHost = 'localhost:' + common.port;
  airbrake.protocol = 'http';

  var errorProcessed = false;

  var errorTimeout = setTimeout(function() {
    errorTimeout = null;
    if (!errorProcessed) {
      assert.ok(false, 'should have processed error before timeout of 5s');
    }
  }, 5000);

  airbrake.on('error', function(err) {
    errorProcessed = true;
    if (errorTimeout !== null) {
      clearTimeout(errorTimeout);
    }

    assert.ok(!!err, 'should receive an error object');
    assert.ok(/notification failed/i.test(err.message));
    server.close();
  });

  airbrake.notify(testNotifyError);
});
