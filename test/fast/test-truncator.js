/* eslint-disable */

var common = require('../common');
var assert = require('assert');
var truncator = require(common.dir.root + '/lib/truncator');


(function testTruncateDoesnotThrow() {
  var tests = [
    [undefined],
    [null],
    [true],
    [false],
    [new Boolean(true)],
    [1],
    [3.14],
    [new Number(1)],
    [Infinity],
    [NaN],
    [Math.LN2],
    ['hello'],
    [new String('hello'), 'hello'],
    [['foo', 'bar']],
    [{'foo': 'bar'}],
    [new Date()],
    [/a/],
    [new RegExp('a')],
    [new Error('hello'), 'Error: hello']
  ];
  tests.forEach(function(test) {
    var wanted = test.length >= 2 ? test[1] : test[0];
    if (isNaN(wanted)) {
      return;
    }

    assert.equal(truncator.truncate(test[0]), wanted);
  });
}());

(function testOmittingFunctionsInObject() {
  var obj = {
    foo: 'bar',
    fn1: Math.sin,
    fn2: function() { return null; },
    fn3: new Function('x', 'y', 'return x * y')
  };

  assert.deepEqual(truncator.truncate(obj),  {foo: 'bar'});
}());

(function testCallingWithAnObjectWithCircularReferences() {
  var obj = {foo: 'bar'};
  obj.circularRef = obj;
  obj.circularList = [obj, obj];

  assert.deepEqual(truncator.truncate(obj), {
    foo: 'bar',
    circularRef: '[Circular ~]',
    circularList: ['[Circular ~]', '[Circular ~]']
  });
}());

(function testCallingWithAnObjectWithComplexCircularReferences() {
  var a = {x: 1};
  a.a = a;
  var b = {x: 2};
  b.a = a;
  var c = {a: a, b: b};

  obj = {list: [a, b, c]};
  obj.obj = obj;

  assert.deepEqual(truncator.truncate(obj), {
    list: [{
      x: 1,
      a: '[Circular ~.list.0]'
    }, {
      x: 2,
      a: '[Circular ~.list.0]'
    }, {
      a: '[Circular ~.list.0]',
      b: '[Circular ~.list.1]'
    }],
    obj: '[Circular ~]'
  });
}());


(function testCallingWithDeeplyNestedObjects() {
  var obj = {};
  var tmp = obj;
  for (var i = 0; i < 100; i++) {
    tmp.value = i;
    tmp.obj = {};
    tmp = tmp.obj;
  }

  var truncated = truncator.truncate(obj, 1);
  assert.deepEqual(truncated, {
    value: 0, obj: {
      value: 1, obj: {
        value: 2, obj: {
          value: 3, obj: '[Truncated Object]'
        }
      }
    }
  });
}());

(function testJsonifyNotice() {
   var obj = {
     params: {arguments: []},
     environment: {env1: 'value1'},
     session: {session1: 'value1'}
   };

  var json = truncator.jsonifyNotice(obj);
  assert.deepEqual(JSON.parse(json), obj);
}());

(function testJsonifyHugeNotice() {
  var json, maxLength = 30000;
  var obj = {
    params: {arr: []}
  };
  for (var i = 0; i < 100; i++) {
    obj.params.arr.push(Array(100).join('x'));
  }
  json = truncator.jsonifyNotice(obj, maxLength);

  assert.ok(json.length < maxLength);
}());

(function testJsonifyNoticeWithOneHugeString() {
  var json, maxLength = 30000;
  var obj = {
    params: {str: Array(100000).join('x')}
  };

  json = truncator.jsonifyNotice(obj, maxLength);
  assert.ok(json.length < maxLength);
}());

(function testJsonifyNoticeWithHugeErrorMessage() {
  var maxLength = 30000;
  var obj = {
    errors: [{
      message: Array(100000).join('x')
    }]
  };
  var fn = function() {
    truncator.jsonifyNotice(obj, maxLength);
  };

  assert.throws(
    fn,
    /node-airbrake: cannot jsonify notice \(length=100081 maxLength=30000\)/
  );

  try {
    fn();
  } catch (err) {
    assert.equal(err.params.json.length, 15003);
  }
}());
