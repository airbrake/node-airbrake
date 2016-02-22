var HTTP_STATUS_CODES = require('http').STATUS_CODES;

var fs = require('fs');
var os = require('os');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');
var xmlbuilder = require('xmlbuilder');
var stackTrace = require('stack-trace');
var hashish = require('hashish');
var querystring = require('querystring');
var stringify = require('json-stringify-safe');

module.exports = Airbrake;
util.inherits(Airbrake, EventEmitter);

function Airbrake() {
  this.key = null;
  this.projectId = null;

  this.host = 'https://' + os.hostname();
  this.env = process.env.NODE_ENV || 'development';
  this.whiteListKeys = [];
  this.blackListKeys = [];
  this.projectRoot = null;
  this.appVersion = null;
  this.timeout = 30 * 1000;
  this.developmentEnvironments = ['development', 'test'];
  this.consoleLogError = false;

  this.proxy = null;
  this.protocol = 'https';
  this.serviceHost =  process.env.AIRBRAKE_SERVER || 'api.airbrake.io';
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
    'domain',
    'domainEmitter',
    'domainBound',
    'ua'
  ];
}

Airbrake.PACKAGE = (function() {
  var json = fs.readFileSync(__dirname + '/../package.json', 'utf8');
  return JSON.parse(json);
})();

Airbrake.createClient = function(key, projectId, env) {
  var instance = new this();
  instance.key = key;
  instance.env = env || instance.env;
  instance.projectId = projectId || instance.projectId;
  return instance;
};

Airbrake.prototype.expressHandler = function(disableUncaughtException) {
  var self = this;

  if(!disableUncaughtException) {
    process.on('uncaughtException', function(err) {
      self._onError(err, true);
    });
  }

  return function errorHandler(err, req, res, next) {
    if (res.statusCode < 400) res.statusCode = 500;

    err.url = req.url;
    err.component = req.url;
    err.action = req.method;
    err.params = req.body;
    err.session = req.session;
    err.ua = req.get('User-Agent');

    self._onError(err, false);
    next(err);
  };
};

Airbrake.prototype._onError = function(err, die) {
  var self = this;
  if (!(err instanceof Error)) {
    err = new Error(err);
  }
  self.log('Airbrake: Uncaught exception, sending notification for:');
  self.log(err.stack || err);

  self.notify(err, function(notifyErr, url, devMode) {
    if (notifyErr) {
      self.log('Airbrake: Could not notify service.');
      self.log(notifyErr.stack);
    } else if (devMode) {
      self.log('Airbrake: Dev mode, did not send.');
    } else {
      self.log('Airbrake: Notified service: ' + url);
    }

    if (die) {
      process.exit(1);
    }
  });
};

Airbrake.prototype.handleExceptions = function(die) {
  var self = this;
  if (typeof die === 'undefined') {
      die = true;
  }
  process.on('uncaughtException', function(err) {
    self._onError(err, die);
  });
};

Airbrake.prototype.log = function(str) {
  if(this.consoleLogError) console.error(str);
};

Airbrake.prototype._sendRequest = function(err, cb) {
  var callback = this._callback(cb);

  var body = this.notifyJSON(err);

  var options = hashish.merge({
    method: 'POST',
    url: this.url('/api/v3/projects/' + this.projectId + '/notices?key=' + this.key),
    body: body,
    timeout: this.timeout,
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }, this.requestOptions);

  request(options, function(err, res, body) {
    if (err) {
      return callback(err);
    }

    if (undefined === body) {
      return callback(new Error('invalid body'));
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];

      var explanation = body.match(/<error>([^<]+)/i);
      explanation = (explanation)
        ? ': ' + explanation[1]
        : ': ' + body;

      return callback(new Error(
        'Notification failed: ' + res.statusCode + ' ' + status + explanation
      ));
    }

    var url = JSON.parse(body).url
    callback(null, url);
  });
}

Airbrake.prototype.notify = function(err, cb) {
  var callback = this._callback(cb);
  var exit = false;
  // log errors instead of posting to airbrake if a dev enviroment
  if (this.developmentEnvironments.indexOf(this.env) != -1) {
    this.log(err);
    return callback(null, null, true);
  }
  this.ignoredExceptions.forEach(function(exception){
    if (err instanceof exception){
      exit = true;
    }
  })

  if (exit){
    return callback(null, null, false);
  }

  return this._sendRequest(err, callback);
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

Airbrake.prototype.notifyJSON = function(err){
  var trace = stackTrace.parse(err);
  var self = this;
  return JSON.stringify({
    "errors": [
      {
        type: err.type || "Error",
        message: err.message || "-",
        backtrace: trace.map(function(callSite){
          return {
            "file": (callSite.getFileName() || "").replace(self.projectRoot, ''),
            "line": callSite.getLineNumber() || "",
            "function": callSite.getFunctionName() || ""
          };
        })
      }
    ]
  });
};

Airbrake.prototype.notifyXml = function(err, pretty) {
  var notice = xmlbuilder.create().begin('notice', {
    version: '1.0',
    encoding: 'UTF-8'
  });

  this.appendHeaderXml(notice);
  this.appendErrorXml(notice, err);
  this.appendRequestXml(notice, err);
  this.appendServerEnvironmentXml(notice);

  return new Buffer(notice.doc().toString({pretty: pretty}));
};

Airbrake.prototype.appendHeaderXml = function(notice) {
  notice
    .att('version', '2.2')
    .ele('api-key')
      .txt(this.key || '-')
    .up()
    .ele('notifier')
      .ele('name')
        .txt(Airbrake.PACKAGE.name)
      .up()
      .ele('version')
        .txt(Airbrake.PACKAGE.version)
      .up()
      .ele('url')
        .txt(Airbrake.PACKAGE.homepage)
      .up()
    .up();
};

Airbrake.prototype.appendErrorXml = function(notice, err) {
  var trace = stackTrace.parse(err);
  var error = notice
    .ele('error')
      .ele('class')
        .txt(err.type || 'Error')
      .up()
      .ele('message')
        .txt(err.message || '-')
      .up()
      .ele('backtrace');

  var self = this;

  trace.forEach(function(callSite) {
    error
      .ele('line')
        .att('method', callSite.getFunctionName() || '')
        .att('file', (callSite.getFileName() || '').replace(self.projectRoot, ""))
        .att('number', callSite.getLineNumber() || '');
  });
};

Airbrake.prototype.appendRequestXml = function(notice, err) {
  var request = notice.ele('request');

  var self = this;
  ['url', 'component', 'action'].forEach(function(nodeName) {
    var node = request.ele(nodeName);
    var val = err[nodeName];

    if (nodeName === 'url') {
      if (!val) {
        val = self.host;
      } else if (val.substr(0, 1) === '/') {
        val = self.host + val;
      }
    }

    if (val) {
      node.txt(val);
    }
  });

  this.addRequestVars(request, 'cgi-data', this.cgiDataVars(err));
  this.addRequestVars(request, 'session', this.sessionVars(err));
  this.addRequestVars(request, 'params', this.paramsVars(err));
};

Airbrake.prototype.addRequestVars = function(request, type, vars) {
  var node;
  Object.keys(vars).forEach(function(key) {
    node = node || request.ele(type);

    var value = vars[key];
    if (! value){
      return;
    }
    if ('string' !== typeof value) {
      value = stringify(value);
    }

    value = value.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/g, " ");

    node
      .ele('var')
      .att('key', key)
      .txt(value);
  });
};

Airbrake.prototype.cgiDataVars = function(err) {
  var cgiData = {};
  var self = this;

  if (this.whiteListKeys.length > 0) {
    Object.keys(process.env).forEach(function(key) {
      if (self.whiteListKeys.indexOf(key) > -1) {
        cgiData[key] = process.env[key];
      } else {
        cgiData[key] = "[FILTERED]";
      }
    })
  } else if (this.blackListKeys.length > 0) {
    Object.keys(process.env).forEach(function(key) {
      if (self.blackListKeys.indexOf(key) > -1 ) {
        cgiData[key] = "[FILTERED]";
      } else {
        cgiData[key] = process.env[key];
      }
    })
  }

  if (err.ua){
    cgiData.HTTP_USER_AGENT = err.ua;
  }

  Object.keys(err).forEach(function(key) {
    if (self.exclude.indexOf(key) >= 0) {
      return;
    }

    cgiData['err.' + key] = err[key];
  });

  cgiData['process.pid'] = process.pid;

  if(os.platform() != "win32") {
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

Airbrake.prototype.sessionVars = function(err) {
  return (typeof err.session  === 'object')
    ? err.session
    : {};
};

Airbrake.prototype.paramsVars = function(err) {
  return (typeof err.params === 'object')
    ? err.params
    : {};
};

Airbrake.prototype.appendServerEnvironmentXml = function(notice) {
  var serverEnvironment = notice.ele('server-environment');

  if (this.projectRoot) {
    serverEnvironment
      .ele('project-root')
      .txt(this.projectRoot);
  }

  serverEnvironment
      .ele('environment-name')
      .txt(this.env);

  if (this.appVersion) {
    serverEnvironment
      .ele('app-version')
      .txt(this.appVersion);
  }
};

Airbrake.prototype.trackDeployment = function(params, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = {};
  }

  params = hashish.merge({
    key: this.key,
    env: this.env,
    user: process.env.USER,
    rev: '',
    repo: '',
  }, params);

  var body = this.deploymentPostData(params);

  var options = hashish.merge({
    method: 'POST',
    url: this.url('/deploys.txt'),
    body: body,
    timeout: this.timeout,
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    proxy: this.proxy
  }, this.requestOptions);

  var callback = this._callback(cb);

  request(options, function(err, res, body) {
    if (err) {
      return callback(err);
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];
      return callback(new Error(
        'Deployment failed: ' + res.statusCode + ' ' + status + ': ' + body
      ));
    }

    callback(null, params);
  });
};

Airbrake.prototype.deploymentPostData = function(params) {
  return querystring.stringify({
    'api_key': params.key,
    'deploy[rails_env]': params.env,
    'deploy[local_username]': params.user,
    'deploy[scm_revision]': params.rev,
    'deploy[scm_repository]': params.repo
  });
};
