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

  this.env = process.env.NODE_ENV;
  this.projectRoot = null;
  this.appVersion = null;

  // Disabled, see comments in appendServerEnvironmentXml()
  // this.hostname = os.hostname();

  this.protocol = 'http';
  this.host = 'airbrakeapp.com';
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

Airbrake.prototype.notify = function(err, cb) {
  var body = this.notifyXml(err);

  var options = {
    method: 'POST',
    url: this.url('/notifier_api/v2/notices'),
    body: body,
    timeout: 30 * 1000,
    headers: {
      'Content-Length': body.length,
    },
  };

  request(options, function(err, res, body) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode >= 300) {
      var status = HTTP_STATUS_CODES[res.statusCode];
      cb(new Error(
        'Notification failed: ' + res.statusCode + ' ' + status
      ));
      return;
    }

    cb(null);
  });
};

Airbrake.prototype.url = function(path) {
  return this.protocol + '://' + this.host + path;
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
    .att('version', '2.0')
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

  ['url', 'component', 'action'].forEach(function(nodeName) {
    var node = request.ele(nodeName);
    if (err[nodeName]) {
      node.txt(err[nodeName]);
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

  // This is not documented, but the Airbrake API told me about it when sending
  // some invalid data. Going to find out if they want people to use it first
  // before enabling.

  //if (this.hostname) {
    //serverEnvironment
      //.ele('hostname')
      //.txt(this.hostname);
  //}
};
