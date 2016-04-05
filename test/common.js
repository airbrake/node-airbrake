var path = require('path');
var _ = require('lodash');

// An account on the free plan specifically for testing this module.
exports.key = '96979331ec7e18bbe7ec1529da2ed083';
exports.projectId = '122374';

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
