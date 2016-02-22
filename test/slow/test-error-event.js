var common = require('../common');
var airbrake = require(common.dir.root).createClient(common.key, null, 'production');
var assert = require('assert');
var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(500);
  res.end('something went wrong');
});


server.listen(common.port, function() {
  var err = new Error('test-notify');
  airbrake.serviceHost = 'localhost:' + common.port;
  airbrake.protocol = 'http';

  var errorTimeout = setTimeout(function () {
    errorTimeout = null
    if (!errorProcessed) {
      assert.ok(false, 'should have processed error before timeout of 5s')
    }
  }, 5000)

  var errorProcessed = false;
  airbrake.on('error', function (err) {
    errorProcessed = true
    if (null !== errorTimeout) {
      clearTimeout(errorTimeout);
    }

    assert.ok(!!err, 'should receive an error object');
    assert.ok(/notification failed/i.test(err.message));
    server.close();
  });

  airbrake.notify(err);
});
