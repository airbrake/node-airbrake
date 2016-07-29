// Ignore rules for initialization file.
/* eslint global-require: 0 */
/* eslint import/no-unresolved: 0 */

var path = require('path');
var merge = require('lodash.merge');

// An account on the free plan specifically for testing this module.
exports.key = '81bbff95d52f8856c770bb39e827f3f6';
exports.projectId = '113743';

// Use custom config if available instead
try {
  merge(exports, require('./config'));
} catch (e) { console.log(e); }

exports.port = 8424;

var root = path.join(__dirname, '..');
exports.dir = {
  root: root,
  lib: root + '/lib'
};
