/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

function identity(value) {
  /**
  Utility function takes a `value` and returns function that returns `value`
  when it's called.
  **/
  return function() {
    return value;
  };
}

function field(name) {
  /**
  Utility function takes a field `name` and return function that return
  property value of the passed `object` with that `name`. Returns undefined
  if if `object` is not given or if such property is not defined.
  **/
  return function getField(object) {
    return object && object[name];
  };
}
exports.field = field;

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
