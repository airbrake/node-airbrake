var pkg = require('../package.json');

var fs = require('fs');
var os = require('os');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var stackTrace = require('stack-trace');
var merge = require('lodash.merge');
var execSync = require('child_process').execSync;
var url = require('url');

var truncator = require('../lib/truncator');


var HTTP_STATUS_CODES = require('http').STATUS_CODES;
var DEFAULT_SEVERITY = 'error';


function Airbrake() {
  this.key = null;
  this.projectId = null;

  this.host = 'https://' + os.hostname();
  this.env = process.env.NODE_ENV || 'development';
  this.whiteListKeys = [];
  this.blackListKeys = [];
  this.filters = [];
  this.projectRoot = process.cwd();
  this.appVersion = null;
  this.timeout = 30 * 1000;
  this.consoleLogError = false;

  this.proxy = null;
  this.protocol = 'https';
  this.serviceHost = process.env.AIRBRAKE_SERVER || 'api.airbrake.io';
  this.requestOptions = {};
  this.ignoredExceptions = [];
  this.exclude = [
    'type',
    'message',
    'arguments',
    'stack',
    'url',
    'session',
    'params',
    'component',
    'action',
    'ua'
  ];
}

merge(Airbrake.prototype, EventEmitter.prototype);

Airbrake.PACKAGE = (function() {
  var json = fs.readFileSync(__dirname + '/../package.json', 'utf8');
  return JSON.parse(json);
}());

Airbrake.createClient = function(projectId, key, env) {
  var instance = new this();
  instance.key = key;
  instance.env = env || instance.env;
  instance.projectId = projectId || instance.projectId;

  if (!instance.key || !instance.projectId) {
    throw new Error('Key or project ID missing during Airbrake.createClient()');
  }

  return instance;
};

Airbrake.prototype.expressHandler = function(disableUncaughtException) {
  var self = this;

  if (!disableUncaughtException) {
    process.on('uncaughtException', function(err) {
      self._onError(err, true);
    });
  }

  return function errorHandler(err, req, res, next) {
    var error = err;
    var requestObj = req;
    var responseObj = res;

    if (responseObj.statusCode < 400) responseObj.statusCode = 500;

    error.url = requestObj.url;
    error.action = requestObj.url;
    error.component = 'express';
    error.httpMethod = requestObj.method;
    error.params = requestObj.body;
    error.session = requestObj.session;
    error.ua = requestObj.get('User-Agent');

    self._onError(err, false);
    next(err);
  };
};

Airbrake.prototype.hapiHandler = function() {
  var self = this;
  var plugin = {
    register: function(server, options, next) {
      server.on('request-error', function(req, err) {
        var error = err;

        error.url =
          req.connection.info.protocol + '://' +
          req.info.host +
          req.url.path;

        error.action = req.url.path;
        error.component = 'hapi';
        error.httpMethod = req.method;
        error.params = request.params;
        error.ua = req.headers['user-agent'];

        self._onError(err, false);
      });

      next();
    }
  };

  plugin.register.attributes = { pkg: pkg };
  return plugin;
};

Airbrake.prototype._onError = function(err, die) {
  var self = this;
  var error = (err instanceof Error) ? err : new Error(err);
  self.log('Airbrake: Uncaught exception, sending notification for:');
  self.log(error.stack || error);

  self.notify(error, function(notifyErr, notifyUrl, devMode) {
    if (notifyErr) {
      self.log('Airbrake: Could not notify service.');
      self.log(notifyErr.stack);
    } else if (devMode) {
      self.log('Airbrake: Dev mode, did not send.');
    } else {
      self.log('Airbrake: Notified service: ' + notifyUrl);
    }

    if (die) {
      process.exit(1);
    }
  });
};

Airbrake.prototype.handleExceptions = function(die) {
  var self = this;
  var shouldDie = (typeof die === 'undefined') ? true : die;
  process.on('uncaughtException', function(err) {
    self._onError(err, shouldDie);
  });
};

Airbrake.prototype.log = function(str) {
  if (this.consoleLogError) {
    console.error(str);
  }
};

Airbrake.prototype._sendRequest = function(body, cb) {
  var callback = this._callback(cb);

  var options = merge({
    method: 'POST',
    url: this.url('/api/v3/projects/' + this.projectId + '/notices?key=' + this.key),
    body: body,
    timeout: this.timeout,
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }, this.requestOptions);

  request(options, function(requestErr, res, responseBody) {
    if (requestErr) {
      return callback(requestErr);
    }

    if (typeof responseBody === 'undefined') {
      return callback(new Error('invalid body'));
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];

      var explanation = responseBody.match(/<error>([^<]+)/i);
      explanation = (explanation)
        ? ': ' + explanation[1]
        : ': ' + responseBody;

      return callback(new Error(
        'Notification failed: ' + res.statusCode + ' ' + status + explanation
      ));
    }

    return callback(null, JSON.parse(responseBody).url);
  });
};

Airbrake.prototype.addFilter = function(filter) {
  this.filters.push(filter);
};

Airbrake.prototype.notify = function(err, cb) {
  var callback = this._callback(cb);
  var exit = false;

  this.ignoredExceptions.forEach(function(exception) {
    if (err instanceof exception) {
      exit = true;
    }
  });

  var notice = this.notifyJSON(err);

  this.filters.forEach(function(filter) {
    if (notice) {
      notice = filter(notice);
    }
  });

  if (exit || !notice) {
    return callback(null, null, false);
  }

  return this._sendRequest(truncator.jsonifyNotice(notice), callback);
};

Airbrake.prototype._callback = function(cb) {
  var self = this;
  return function(err) {
    if (cb) {
      cb.apply(self, arguments);
      return;
    }

    if (err) {
      self.emit('error', err);
    }
  };
};

Airbrake.prototype.url = function(path) {
  return this.protocol + '://' + this.serviceHost + path;
};

Airbrake.prototype.environmentJSON = function(err) {
  var cgiData = {};
  var self = this;

  if (this.whiteListKeys.length > 0) {
    Object.keys(process.env).forEach(function(key) {
      if (self.whiteListKeys.indexOf(key) > -1) {
        cgiData[key] = process.env[key];
      } else {
        cgiData[key] = '[FILTERED]';
      }
    });
  } else if (this.blackListKeys.length > 0) {
    Object.keys(process.env).forEach(function(key) {
      if (self.blackListKeys.indexOf(key) > -1) {
        cgiData[key] = '[FILTERED]';
      } else {
        cgiData[key] = process.env[key];
      }
    });
  }

  if (err.httpMethod) {
    cgiData.httpMethod = err.httpMethod;
  }

  Object.keys(err).forEach(function(key) {
    if (self.exclude.indexOf(key) >= 0) {
      return;
    }

    cgiData['err.' + key] = err[key];
  });

  cgiData['process.pid'] = process.pid;

  if (os.platform() !== 'win32') {
    // this two properties are *NIX only
    cgiData['process.uid'] = process.getuid();
    cgiData['process.gid'] = process.getgid();
  }

  cgiData['process.cwd'] = process.cwd();
  cgiData['process.execPath'] = process.execPath;
  cgiData['process.version'] = process.version;
  cgiData['process.argv'] = process.argv;
  cgiData['process.memoryUsage'] = process.memoryUsage();
  cgiData['os.loadavg'] = os.loadavg();
  cgiData['os.uptime'] = os.uptime();

  return cgiData;
};

Airbrake.prototype.contextJSON = function(err) {
  var context = {};
  context.notifier = {
    name: 'node-airbrake',
    version: Airbrake.PACKAGE.version,
    url: Airbrake.PACKAGE.homepage
  };

  context.environment = this.env;
  context.rootDirectory = this.projectRoot;
  context.os = os.type();
  context.hostname = os.hostname();
  context.url = url.resolve(this.host, err.url || '');
  context.userAgent = err.ua;
  context.component = err.component;
  context.action = err.action;
  context.severity = err.severity || DEFAULT_SEVERITY;

  return context;
};

Airbrake.prototype.notifyJSON = function(err) {
  var trace = stackTrace.parse(err);
  var self = this;

  return {
    errors: [
      {
        type: err.type || 'Error',
        message: err.message,
        backtrace: trace.map(function(callSite) {
          return {
            file: callSite.getFileName() || '',
            line: callSite.getLineNumber(),
            function: callSite.getFunctionName() || ''
          };
        })
      }],
    environment: self.environmentJSON(err),
    context: self.contextJSON(err),
    session: self.sessionVars(err),
    params: self.paramsVars(err)
  };
};

Airbrake.prototype.sessionVars = function(err) {
  return (typeof err.session === 'object')
    ? err.session
    : {};
};

Airbrake.prototype.paramsVars = function(err) {
  return (typeof err.params === 'object')
    ? err.params
    : {};
};

Airbrake.prototype.trackDeployment = function(params, cb) {
  var callback = cb;
  var deploymentParams = params || {};

  if (typeof deploymentParams === 'function') {
    callback = deploymentParams;
    deploymentParams = {};
  }

  deploymentParams = merge({
    key: this.key,
    env: this.env,
    user: process.env.USER,
    rev: execSync('git rev-parse HEAD').toString().trim(),
    repo: execSync('git config --get remote.origin.url').toString().trim()
  }, deploymentParams);

  var body = this.deploymentPostData(deploymentParams);

  var options = merge({
    method: 'POST',
    url: this.url('/api/v4/projects/' + this.projectId + '/deploys?key=' + this.key),
    body: body,
    timeout: this.timeout,
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/json'
    },
    proxy: this.proxy
  }, this.requestOptions);

  var requestCallback = this._callback(callback);

  request(options, function(err, res, responseBody) {
    if (err) {
      return requestCallback(err);
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];
      return requestCallback(new Error(
        'Deployment failed: ' + res.statusCode + ' ' + status + ': ' + responseBody
      ));
    }

    return requestCallback(null, deploymentParams);
  });
};

Airbrake.prototype.deploymentPostData = function(params) {
  return JSON.stringify({
    version: 'v2.0',
    environment: params.env,
    username: params.user,
    revision: params.rev,
    repository: params.repo
  });
};

module.exports = Airbrake;
