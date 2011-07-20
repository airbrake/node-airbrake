var HTTP_STATUS_CODES = require('http').STATUS_CODES;

var fs = require('fs');
var os = require('os');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');
var xmlbuilder = require('xmlbuilder');
var stackTrace = require('stack-trace');
var traverse = require('traverse');

module.exports = Airbrake;
util.inherits(Airbrake, EventEmitter);
function Airbrake() {
  this.key = null;

  this.host = 'http://' + os.hostname();
  this.env = process.env.NODE_ENV;
  this.projectRoot = null;
  this.appVersion = null;
  this.timeout = 30 * 1000;

  this.protocol = 'http';
  this.serviceHost = 'airbrakeapp.com';
}

Airbrake.PACKAGE = (function() {
  var json = fs.readFileSync(__dirname + '/../package.json', 'utf8');
  return JSON.parse(json);
})();

Airbrake.createClient = function(key, env) {
  var instance = new this();
  instance.key = key;
  instance.env = env || instance.env;
  return instance;
};

Airbrake.prototype.handleExceptions = function() {
  var self = this;
  process.on('uncaughtException', function(err) {
    self.log('Airbrake: Uncaught Exception:');
    self.log(err.stack);

    self.notify(err, function(notifyErr, url) {
      if (notifyErr) {
        self.log('Airbrake: Could not notify service.');
        self.log(notifyErr.stack);
      } else {
        self.log('Airbrake: Notified service: ' + url);
      }

      process.exit(1);
    });
  });
};

Airbrake.prototype.log = function(str) {
  console.error(str);
};

Airbrake.prototype.notify = function(err, cb) {
  var body = this.notifyXml(err);

  var options = {
    method: 'POST',
    url: this.url('/notifier_api/v2/notices'),
    body: body,
    timeout: this.timeout,
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'text/xml',
    },
  };

  var self = this;
  var callback = function(err) {
    if (cb) {
      cb.apply(self, arguments);
      return;
    }

    if (err) {
      self.emit('error', err);
    }
  };

  request(options, function(err, res, body) {
    if (err) {
      return callback(err);
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];
      return callback(new Error(
        'Notification failed: ' + res.statusCode + ' ' + status
      ));
    }

    // Give me a break, this is legit : )
    var m = body.match(/<url>([^<]+)/i);
    var url = (m)
      ? m[1]
      : null;

    callback(null, url);
  });
};

Airbrake.prototype.url = function(path) {
  return this.protocol + '://' + this.serviceHost + path;
};

Airbrake.prototype.notifyXml = function(err, pretty) {
  var notice = xmlbuilder().begin('notice', {
    version: '1.0',
    encoding: 'UTF-8'
  });

  this.appendHeaderXml(notice);
  this.appendErrorXml(notice, err);
  this.appendRequestXml(notice, err);
  this.appendServerEnvironmentXml(notice);

  return notice.up().toString({pretty: pretty});
};

Airbrake.prototype.appendHeaderXml = function(notice) {
  notice
    .att('version', '2.1')
    .ele('api-key')
      .txt(this.key)
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
        .txt(err.message)
      .up()
      .ele('backtrace')

  trace.forEach(function(callSite) {
    error
      .ele('line')
        .att('method', callSite.getFunctionName())
        .att('file', callSite.getFileName())
        .att('number', callSite.getLineNumber())
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
  this.emit('vars', type, vars);

  var node;
  Object.keys(vars).forEach(function(key) {
    // JSON.stringify throws on circular structures, lets remove those
    var val = traverse(vars[key]).map(function(node) {
      if (this.circular) {
        this.update('[Circular]');
      }
    });


    val = JSON.stringify(val);

    node = node || request.ele(type);

    node
      .ele('var')
      .att('key', key)
      .txt(val);
  });
};

Airbrake.prototype.cgiDataVars = function(err) {
  var cgiData = {};
  Object.keys(process.env).forEach(function(key) {
    cgiData[key] = process.env[key];
  });

  var errorEnv = (err.env instanceof Object)
    ? err.env
    : {};

  Object.keys(errorEnv).forEach(function(key) {
    cgiData[key] = err.env[key];
  });

  return cgiData;
};

Airbrake.prototype.sessionVars = function(err) {
  return (err.session instanceof Object)
    ? err.session
    : {};
};

Airbrake.prototype.paramsVars = function(err) {
  return (err.params instanceof Object)
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
      .txt(this.env)

  if (this.appVersion) {
    serverEnvironment
      .ele('app-version')
      .txt(this.appVersion);
  }
};
