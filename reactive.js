/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var unbind = Function.call.bind(Function.bind, Function.call);
var slice = Array.slice || unbind(Array.prototype.slice);

function identity(value) {
  return value;
}
exports.identity = identity;

function reactive(input) {
  return typeof(input) === 'function' ? input : value(input);
}
exports.reactive = reactive;

function value(input) {
  /**
  Utility function takes a `value` and returns function that returns `value`
  when it's called.
  **/
  return function value() {
    return input;
  };
}
exports.value = value;

function field(name) {
  /**
  Utility function takes a field `name` and return function that return
  property value of the passed `object` with that `name`. Returns undefined
  if if `object` is not given or if such property is not defined.
  **/
  return function value(input) {
    return input && input[name];
  };
}
exports.field = field;

function method(name) {
  /**
  Utility function takes method `name` and returns a function, which on
  invoke calls method of the first argument and returns value back.
  **/
  return function invoke(input) {
    return input && input[name] && input[name].apply(input, slice(arguments, 1));
  };
}
exports.method = method;

function query(path, delimiter) {
  var names = path.split(delimiter || '.');
  return function value(input) {
    return names.reduce(query.get, input);
  };
}
query.get = function get(input, name) {
  return input && input[name];
};
exports.query = query;

function is(actual, expected) {
  actual = reactive(actual);
  expected = reactive(expected);
  return function assertion(input) {
    return actual(input) === expected(input);
  };
}
exports.is = is;

function isnt(actual, expected) {
  var assert = is(actual, expected);
  return function assertion(input) {
    return !assert(input);
  };
}
exports.isnt = isnt;

function and() {
  var conditions = slice(arguments).map(reactive);
  return function value(input) {
    return conditions.every(function(condition) {
      return condition(input);
    });
  };
}
exports.and = and;

function or() {
  var conditions = slice(arguments).map(reactive);
  return function value(input) {
    var index = 0, count = conditions.length;
    var result = false;
    while (index < count) {
      result = result || conditions[index++](input);
      if (result) break;
    }
    return result;
  };
}
exports.or = or;

function join(a, b) {
  var descriptor = {};
  var names = Object.getOwnPropertyNames(a).concat(Object.getOwnPropertyNames(b));
  names.forEach(function(name) {
    descriptor[name] = Object.getOwnPropertyDescriptor(b, name) ||
      Object.getOwnPropertyDescriptor(a, name);
  });
  return Object.create(Object.prototype, descriptor);
}
exports.join = join;
