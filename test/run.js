#!/usr/bin/env node
var far = require('far').create();

far.add(__dirname);

var specificTest = process.argv[2]
if (undefined !== specificTest) {
  far.include(new RegExp('test-' + specificTest + '\.js$'));
} else {
  far.include(/test-.*\.js$/);
}


var verbosity = process.argv[3]
if (undefined !== verbosity) {
  verbosity = Number(verbosity)
  
  if (1 !== verbosity && 2 !== verbosity) {
    console.log('Please provide a verbosity value of 1 or 2')
    process.exit(1)
  }

  far.verbose(verbosity)
} 

far.execute();
