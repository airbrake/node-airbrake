var path = require('path');
var _ = require('lodash');

// An account on the free plan specifically for testing this module.
exports.key = '092f2e6780f7c9117353d28dbe8486a3';
exports.projectId = '72058';

// Use custom config if available instead
try {
  _.merge(exports, require('./config'));
} catch (e) {}

exports.port = 8424;

var root = path.join(__dirname, '..');
exports.dir = {
  root: root,
  lib: root + '/lib',
};
