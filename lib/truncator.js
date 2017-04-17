function Truncator(level) {
  if (level === null || level === undefined || level < 0) {
    level = 0;
  }

  this.maxStringLength = 1024;
  this.maxObjectLength = 128;
  this.maxArrayLength = 32;
  this.maxDepth = 8;

  this.keys = [];
  this.seen = [];

  for (var i = 0; i < level; i++) {
    if (this.maxStringLength > 1) {
      this.maxStringLength /= 2;
    }
    if (this.maxObjectLength > 1) {
      this.maxObjectLength /= 2;
    }
    if (this.maxArrayLength > 1) {
      this.maxArrayLength /= 2;
    }
    if (this.maxDepth > 1) {
      this.maxDepth /= 2;
    }
  }
}

Truncator.prototype.truncate = function(value, key, depth) {
  if (value === null || value === undefined) {
    return value;
  }
  if (key === null || key === undefined) {
    key = '';
  }
  if (depth === null || depth === undefined) {
    depth = 0;
  }

  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'function':
      return value;
    case 'string':
      return this.truncateString(value);
    case 'object':
      break;
    default:
      return String(value);
  }

  if (value instanceof String) {
    return this.truncateString(value.toString());
  }

  if (value instanceof Boolean ||
      value instanceof Number ||
      value instanceof Date ||
      value instanceof RegExp) {
    return value;
  }

  if (value instanceof Error) {
    return value.toString();
  }

  if (this.seen.indexOf(value) >= 0) {
    return '[Circular ' + this.getPath(value) + ']';
  }

  var type = this.objectType(value);

  depth++;
  if (depth > this.maxDepth) {
    return '[Truncated ' + type + ']';
  }

  this.keys.push(key);
  this.seen.push(value);

  switch (type) {
    case 'Array':
      return this.truncateArray(value, depth);
    case 'Object':
      return this.truncateObject(value, depth);
    default:
      var saved = this.maxDepth;
      this.maxDepth = 0;

      var obj = this.truncateObject(value, depth);
      obj.__type = type;

      this.maxDepth = saved;

      return obj;
  }
};

Truncator.prototype.getPath = function(value) {
  var index = this.seen.indexOf(value);
  var path = [this.keys[index]];
  for (var i = index; i >= 0; i--) {
    var sub = this.seen[i];
    if (sub && sub[path[0]] === value) {
      value = sub;
      path.unshift(this.keys[i]);
    }
  }

  return '~' + path.join('.');
};

Truncator.prototype.truncateString = function(s) {
  if (s.length > this.maxStringLength) {
    return s.slice(0, this.maxStringLength) + '...';
  }

  return s;
};

Truncator.prototype.truncateArray = function(arr, depth) {
  var length = 0;
  var dst = [];

  for (var i = 0; i < arr.length; i++) {
    var el = arr[i];

    length++;
    if (length >= this.maxArrayLength) {
      break;
    }

    dst.push(this.truncate(el, i, depth));
  }

  return dst;
};


Truncator.prototype.truncateObject = function(obj, depth) {
  var length = 0;
  var dst = {};

  for (var attr in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, attr)) {
      var value = obj[attr];

      if (value === undefined || typeof value === 'function') {
        continue;
      }

      length++;
      if (length >= this.maxObjectLength) {
        break;
      }

      dst[attr] = this.truncate(value, attr, depth);
    }
  }

  return dst;
};

Truncator.prototype.objectType = function(obj) {
  var s = Object.prototype.toString.apply(obj);
  return s.slice('[object '.length, -1);
};

// truncateObj truncates each key in the object separately, which is
// useful for handling circular references.
function truncateObj(obj, level) {
  var dst = {};
  for (var attr in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, attr)) {
      dst[attr] = module.exports.truncate(obj[attr], level);
    }
  }

  return dst;
}


module.exports.truncate = function truncate(value, level) {
  var t = new Truncator(level);
  return t.truncate(value);
};

// jsonifyNotice serializes notice to JSON and truncates params,
// environment and session keys.
module.exports.jsonifyNotice = function jsonifyNotice(notice, maxLength) {
  if (maxLength === null || maxLength === undefined) {
    maxLength = 64000;
  }

  var s = '';
  for (var level = 0; level < 8; level++) {
    notice.context = truncateObj(notice.context, level);
    notice.params = truncateObj(notice.params, level);
    notice.environment = truncateObj(notice.environment, level);
    notice.session = truncateObj(notice.session, level);

    s = JSON.stringify(notice);
    if (s.length < maxLength) {
      return s;
    }
  }

  var err = new Error(
    'node-airbrake: cannot jsonify notice (length=' + s.length + ' maxLength=' +
      maxLength + ')'
  );
  err.params = {
    json: s.slice(0, Math.floor(maxLength / 2)) + '...'
  };
  throw err;
};
