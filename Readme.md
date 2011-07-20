# airbrake

Node.js client for [airbrakeapp.com][], formerly hoptoad.

[airbrakeapp.com]: http://airbrakeapp.com/

## Install

Not ready for you yet.

## Basic usage

The common use case for this module is to catch all `'uncaughtException'`
events on the `process` object and send them to airbreak:

``` javascript
var airbreak = require('airbrake').createClient("your api key");
airbrake.handleExceptions();

throw new Error('I am an uncaught exception');
```

Please note that the above will re-throw the exception after it has been
successfully delivered to airbreak, caushing your process to exit with status 1.

If you want more control over the delivery of your errors, you can also
manually submit errors to airbreak.

``` javascript
var airbreak = require('airbrake').createClient("your api key");
var err = new Error('Something went terribly wrong');
airbrake.notify(err, function(err) {
  if (err) throw err;

  // Error has been delivered
});
```

## Adding context to errors

The `notify()` method automatically adds the following context information to
each delivered error:

* **error.class:** (`err.type` if set, or `'Error'`)
* **error.message:** (`err.message`)
* **error.backtrace:** (`err.stack` as parsed by [stack-trace][])
* **request.url:** (`err.url` if set);
* **request.component:** (`err.component` if set);
* **request.action:** (`err.action` if set);
* **request.cgi-data:** (`process.env`, and `err.env` if set)
* **request.params:** (`err.params` if set)
* **request.session:** (`err.session` if set)
* **server-environment:** (`airbreak.env`, defaults to `process.env.NODE_ENV`)

You can add additional context information by modifying the error properties
listed above:

``` javascript
var airbreak = require('airbrake').createClient("your api key");
var http = require('http');

http.createServer(function(req, res) {
  if (req.headers['X-Secret'] !== 'my secret') {
    var err = new Error('403 - Permission denied');
    req.writeHead(403);
    req.end(err.message);

    err.url = req.url;
    err.params = {ip: req.socket.remoteAddress};
    airbrake.notify(err):
  }
});
```

Unfortunately `uncaughtException` events cannot be traced back to particular
requests, so you should still try to handle errors where they occur.

[stack-trace]: https://github.com/felixge/node-stack-trace

## API
