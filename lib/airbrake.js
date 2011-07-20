var fs = require('fs');
var request = require('request');
var HTTP_STATUS_CODES = require('http').STATUS_CODES;
var xmlbuilder = require('xmlbuilder');
var stackTrace = require('stack-trace');

module.exports = Airbrake;
function Airbrake() {
  this.key = null;
  this.env = process.env.NODE_ENV;
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
  var body = this.notifyXml(err, true);
  console.error(body);
  return;

  //var body = this.notifyXml(err);

  var options = {
    method: 'POST',
    url: this.url('/notifier_api/v2/notices'),
    body: body,
    headers: {
      'Content-Length': body.length,
    },
  };

  request(options, function(err, res, body) {
    if (err) {
      return cb(err);
    }

    console.error(res.statusCode, body);

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

  this.appendCgiDataXml(request);
};

Airbrake.prototype.appendCgiDataXml = function(request) {
  var cgiData = request.ele('cgi-data');
  Object.keys(process.env).forEach(function(key) {
    var val = JSON.stringify(process.env[key]);
    cgiData
      .ele('var')
      .att('key', key)
      .txt(val);
  });
};

Airbrake.prototype.appendServerEnvironmentXml = function(notice) {
  notice
    .ele('server-environment')
      .ele('environment-name')
        .txt(this.env)
      .up()
};
