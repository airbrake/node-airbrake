Node Airbrake
=============

[![Circle CI](https://circleci.com/gh/airbrake/node-airbrake.svg?style=shield)](https://circleci.com/gh/airbrake/node-airbrake)
[![npm version](https://badge.fury.io/js/airbrake.svg)](https://badge.fury.io/js/airbrake)
[![Documentation Status](http://inch-ci.org/github/airbrake/node-airbrake.svg?branch=master)](http://inch-ci.org/github/airbrake/node-airbrake)
[![Downloads](https://img.shields.io/npm/dt/airbrake.svg)](https://www.npmjs.com/package/airbrake)

**DEPRECATION WARNING: Node Airbrake is deprecated in favour of Airbrake JS
(https://github.com/airbrake/airbrake-js). Please migrate to it as soon as
possible.**

![Node Airbrake][arthur-node]

* [Node Airbrake README][node-airbrake]

Introduction
------------

**DEPRECATION WARNING: Node Airbrake is deprecated in favour of Airbrake JS
(https://github.com/airbrake/airbrake-js). Please migrate to it as soon as
possible.**

_Node Airbrake_ is a Node.js notifier for [Airbrake][airbrake-io], the leading
exception reporting service. The library provides minimalist API that enables
the ability to send _any_ Node exception to the Airbrake dashboard. Node
Airbrake provides out-of-box integration with the Express web framework.

Key features
------------

![The Airbrake Dashboard][dashboard]

* Send chosen environment variables (whitelist or blacklist)
* Detect and fix circular references in error context information
* Support for all features of the [2.1 notification API][2.1api]
* Support for [long-stack-traces][]
* Optional auto-handler for `uncaughtException` events
* Provides notification URL linking to Airbrake in `notify()` callback
* Timeout Airbrake requests after 30 seconds, you never know
* Express web application framework support
* hapi web application framework support

Installation
------------

### NPM

Add the Node Airbrake package to your `package.json`:

```js
{
  "dependencies": {
    "airbrake": "^2.1.1"
  }
}
```

### Manual

Invoke the following command from your terminal:

```sh
npm install airbrake
```

Examples
--------

### Basic example

This is the minimal example that you can use to test Node Airbrake with your
project. The common use case for this module is to catch all `'uncaughtException'`
events on the `process` object and send them to Airbrake:

```js
var airbrake = require('airbrake').createClient(
  '105138', // Project ID
  'fd04e13d806a90f96614ad8e529b2822' // Project key
);
airbrake.handleExceptions();

throw new Error('I am an uncaught exception');
```

Note: the above will re-throw the exception after it has been successfully
delivered to Airbrake, causing your process to exit with status 1.

This can optionally be disabled by passing false to `handleExceptions` (not
recommended):

```js
airbrake.handleExceptions(false);
```

### Filtering errors

There may be some errors thrown in your application that you're not interested in sending to Airbrake, such as errors thrown by 3rd-party libraries.

The Airbrake notifier makes it simple to ignore this chaff while still processing legitimate errors. Add filters to the notifier by providing filter functions to `addFilter`.

`addFilter` accepts the entire [error notice](https://airbrake.io/docs/#create-notice-v3) to be sent to Airbrake, and provides access to the `context`, `environment`, `params`, and `session` values submitted with the notice, as well as the single-element `errors` array with its `backtrace` element and associated backtrace lines.

The return value of the filter function determines whether or not the error notice will be submitted.
  * If null value is returned, the notice is ignored.
  * Otherwise returned notice will be submitted.

An error notice must pass all provided filters to be submitted.

In the following example errors triggered with a message of 'this should not be posted to airbrake' will be ignored:

```js
airbrake.addFilter(function(notice) {
  if (notice.errors[0].message === 'this should not be posted to airbrake') {
    // Ignore errors with this messsage
    return null;
  }
  return notice;
});
```

Filters can be also used to modify notice payload, e.g. to set environment and application version:

```js
airbrake.addFilter(function(notice) {
  notice.context.environment = 'production';
  notice.context.version = '1.2.3';
  return notice;
});
```

### Manual error delivery

If you want more control over the delivery of your errors, you can also
manually submit errors to Airbrake:

```js
var airbrake = require('airbrake').createClient("your project ID", "your api key");
var err = new Error('Something went terribly wrong');
airbrake.notify(err, function(err, url) {
  if (err) throw err;

  // Error has been delivered, url links to the error in airbrake
});
```

### Severity

[Severity](https://airbrake.io/docs/airbrake-faq/what-is-severity/) allows
categorizing how severe an error is. By default, it's set to `error`. To
redefine severity, simply set an error's `severity` property. For example:

```js
var err = new Error();
err.severity = 'critical';

airbrake.notify(err);
```

### Express integration

The library provides out-of-box integration with the Express framework. It
supports even old Express versions (starting from `2.x`). Select your version
below and configure accordingly.

#### Express 4.x

```js
var airbrake = require('airbrake').createClient("your project ID", "your api key");
app.use(airbrake.expressHandler());
```

#### Express 3.x

```js
var airbrake = require('airbrake').createClient("your project ID", "your api key");
app.use(app.router);
app.use(airbrake.expressHandler());
```

#### Express 2.x

```js
var airbrake = require('airbrake').createClient("your project ID", "your api key");
app.error(airbrake.expressHandler());
```

### hapi integration

The library provides out-of-box integration with the hapi framework. To
integrate Airbrake with a hapi application simply install our handler:

```js
const Hapi = require('hapi');
const server = new Hapi.Server();
const Airbrake = require('airbrake').createClient(
  "your project ID",
  "your api key"
);

Airbrake.env = 'production';

server.register(Airbrake.hapiHandler(), err => {
  if (err) {
    throw err;
  }
});
```

API
---

## Adding context to errors

The `notify()` method automatically adds the following context information to
each delivered error:

* **error.class:** (`err.type` string if set, or `'Error'`)
* **error.message:** (`err.message` string)
* **error.backtrace:** (`err.stack` as parsed by [stack-trace][])
* **error.severity:** (`err.severity` defaults to `error`)
* **request.url:** (`err.url`, see `airbrake.url`);
* **request.component:** (`err.component` string if set);
* **request.action:** (`err.action` string if set);
* **request.cgi-data:** (`process.env`, merged all other properties of `err`)
* **request.params:** (`err.params` object if set)
* **request.session:** (`err.session` object if set)
* **server-environment.project-root:** (`airbrake.projectRoot` string if set)
* **server-environment.environment-name:** (`airbrake.env` string)
* **server-environment.app-version:** (`airbrake.appVersion string if set)

You can add additional context information by modifying the error properties
listed above:

``` javascript
var airbrake = require('airbrake').createClient("your project ID", "your api key");
var http = require('http');

http.createServer(function(req, res) {
  if (req.headers['X-Secret'] !== 'my secret') {
    var err = new Error('403 - Permission denied');
    req.writeHead(403);
    req.end(err.message);

    err.url = req.url;
    err.params = {ip: req.socket.remoteAddress};
    airbrake.notify(err);
  }
});
```

Unfortunately `uncaughtException` events cannot be traced back to particular
requests, so you should still try to handle errors where they occur.

[stack-trace]: https://github.com/felixge/node-stack-trace

## Tracking deployments

This client supports Airbrake's [deployment tracking][]:

``` javascript
var airbrake = require('airbrake').createClient("your project ID", "your api key");
var deployment = {
  rev: '98103a8fa850d5eaf3666e419d8a0a93e535b1b2',
  repo: 'git@github.com:felixge/node-airbrake.git',
};

airbrake.trackDeployment(deployment, function(err, params) {
  if (err) {
    throw err;
  }

  console.log('Tracked deployment of %s to %s', params.rev, params.env);
});
```

Check out the `airbrake.trackDeployment()` API docs below for a list of all
options.

Configuration
-------------

### var airbrake = Airbrake.createClient(projectId, key, [env])

`Airbrake.createClient()` returns a new Airbrake instance.

Options
* `projectId` - Your application's Airbrake project ID.
* `key` - Your application's Airbrake API key.
* `env` - The name of the server environment this is running in.

### airbrake.projectId = null

Your application's Airbrake project ID.

### airbrake.key = null

Your application's Airbrake API key.

### airbrake.env = process.env.NODE_ENV || 'development'

The name of the server environment this is running in.

### airbrake.host = 'https://' + os.hostname()

The base url for errors. If `err.url` is not set, `airbrake.host` is used
instead. If `err.url` is a relative url starting with `'/'`, it is appended
to `airbrake.host`. If `err.url` is an absolute url, `airbrake.host` is ignored.

### airbrake.projectRoot = process.cwd()

The root directory of this project.

### airbrake.appVersion = null

The version of this app. Set to a semantic version number, or leave unset.

### airbrake.protocol = 'https'

The protocol to use.

### airbrake.timeout = 30 * 1000

The timeout after which to give up trying to notify Airbrake in ms.

### airbrake.proxy = null

The HTTP/HTTPS proxy to use when making requests.

### airbrake.requestOptions = {}

Additional request options that are merged with the default set of options that are passed to `request` during `notify()` and `trackDeployment()`.

### airbrake.whiteListKeys = []

Names of environment variables to send.

### airbrake.blackListKeys = []

Names of environment variables to filter out.

### airbrake.handleExceptions()

Registers a `process.on('uncaughtException')` listener. When an uncaught
exception occurs, the error is sent to Airbrake, and then re-thrown to
kill the process.

### airbrake.handlePromiseRejections()

Registers a `process.on('unhandledRejection')` listener. When an uncaught
exception occurs inside a promise, the error is sent to Airbrake, and then re-thrown to
kill the process.

### airbrake.expressHandler(disableUncaughtException)

A custom error handler that is used with Express. Integrate with Express
middleware using `app.use()`.

Options:
* `disableUncaughtException`: Disables re-throwing and killing process on uncaught exception.

### airbrake.notify(err, [cb])

Sends the given `err` to airbrake.

The callback parameter receives two arguments, `err, url`. `err` is set if
the delivery to Airbrake failed.

If no `cb` is given, and the delivery fails, an `error` event is emitted. If
there is no listener for this event, node will kill the process as well. This
is done to avoid silent error delivery failure.

### airbrake.trackDeployment([params, [cb]])

Notifies Airbrake about a deployment. `params` is an object with the following
options:

* `env:` The environment being deployed, defaults to `airbrake.env`.
* `user:` The user doing the deployment, defaults to `process.env.USER`.
* `repo:` The github url of this repository. Defaults to `git config --get remote.origin.url`.
* `rev:` The revision of this deployment. Defaults to `git rev-parse HEAD`.

Additional notes
----------------

### Exception limit

The maximum size of an exception is 64KB. Exceptions that exceed this limit will
be truncated to fit the size.

License
-------

The library was originally created by [Felix Geisendörfer](https://github.com/felixge).
The project uses the MIT License. See LICENSE.md for details.

[arthur-node]: http://s3.amazonaws.com/airbrake-github-assets/node-airbrake/arthur-node.jpeg
[node-airbrake]: https://github.com/airbrake/node-airbrake
[airbrake-io]: https://airbrake.io
[long-stack-traces]: https://github.com/tlrobinson/long-stack-traces
[2.1api]: http://help.airbrake.io/kb/api-2/notifier-api-version-21
[screenshot]: https://github.com/airbrake/node-airbrake/raw/master/screenshot.png
[deployment tracking]: https://airbrake.io/docs/airbrake-faq/deploy-tracking/
[dashboard]: http://s3.amazonaws.com/airbrake-github-assets/node-airbrake/airbrake-dashboard.png
