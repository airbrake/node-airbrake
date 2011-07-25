var path = require('path');

// An account on the free plan specifically for testing this module.
exports.key = 'eee7284b1d06c3d9e7adf9936dcd867e';

exports.port = 8424;

var root = path.join(__dirname, '..');
exports.dir = {
  root: root,
  lib: root + '/lib',
};
