// Ignore rules for initialization file.
/* eslint global-require: 0 */
/* eslint import/no-unresolved: 0 */

var path = require('path');
var merge = require('lodash.merge');

// An account on the free plan specifically for testing this module.
exports.key = '96979331ec7e18bbe7ec1529da2ed083';
exports.projectId = '122374';

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
