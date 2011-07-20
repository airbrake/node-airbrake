# airbrake

Node.js client for [airbrakeapp.com][], formerly hoptoad.

## Install

Not ready for you yet.

## Usage

The common use case for this module is to catch all `'uncaughtException'`
events on the `process` object and send them to airbreak:

``` javascript
var airbreak = require('airbrake').createClient("your api key", "your environment");
airbrake.handleExceptions();

throw new Error('I am an uncaught exception');
```

Please note that the above will re-throw the exception after it has been
successfully delivered to hoptoad, caushing your process to exit with status 1.

If you want more control over the delivery of your errors, you can also
manually submit errors to Hoptoad.

``` javascript
var airbreak = require('airbrake').createClient("your api key", "your environment");
var err = new Error('Something went terribly wrong');
airbrake.notify(err, function(err) {
  // Error has been delivered
});
```

WIP
