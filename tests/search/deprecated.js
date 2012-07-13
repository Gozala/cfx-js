/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var deprecated = require('../../search/deprecated'),
    search = deprecated.search, descriptors = deprecated.descriptors;
var fixtures = require('../fixtures');
var streamer = require('streamer/core'),
    map = streamer.map;

exports.Assert = require('../assert').Assert;

function packages() {
  return descriptors([ fixtures.resolve('JETPACK_PATH', '1.8', 'packages') ]);
}
function addon(name) {
  return fixtures.resolve('JETPACK_PATH', '1.8', 'packages', name);
}

function node(type, requirement, path) {
  return {
    type: 'deprecated',
    requirement: requirement,
    path: fixtures.resolve('JETPACK_PATH', '1.8', 'packages', path),
    warning: { type: type }
  };
}

exports['test search "two" from "one"'] = function(expect, complete) {
  var actual = search('two', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('main', 'two', 'two/index.js'),
    node('own', 'two', 'one/lib/two.js'),
    node('dependency', 'two', 'one/lib/two.js')).then(complete);
};

exports['test search "main" from "one"'] = function(expect, complete) {
  var actual = search('main', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('own', 'main', 'one/lib/main.js'),
    node('dependency', 'main', 'five/lib/main.js'),
    node('dependency', 'main', 'four/lib/main.js'),
    node('dependency', 'main', 'one/lib/main.js'),
    node('dependency', 'main', 'seven/lib/main.js'),
    node('dependency', 'main', 'three/lib/main.js')).then(complete);
};

exports['test search "tree" from "one"'] = function(expect, complete) {
  var actual = search('three', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('main', 'three', 'three/lib/main.js')).then(complete);
};

exports['test search "addon-kit/panel" from "one"'] = function(expect, complete) {
  var actual = search('addon-kit/panel', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('packaged', 'addon-kit/panel', 'addon-kit/lib/panel.js')
  ).then(complete);
};

exports['test search "panel" from "one"'] = function(expect, complete) {
  var actual = search('panel', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('core', 'panel', 'addon-kit/lib/panel.js'),
    node('dependency', 'panel', 'addon-kit/lib/panel.js')
  ).then(complete);
};

exports['test search "promise" from "one"'] = function(expect, complete) {
  var actual = search('promise', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('core', 'promise', 'api-utils/lib/promise.js'),
    node('dependency', 'promise', 'api-utils/lib/promise.js')
  ).then(complete);
};

exports['test search "two/core" from "one"'] = function(expect, complete) {
  var actual = search('two/core', packages(), { root: addon('one') });
  expect(actual).to.be(
    node('packaged', 'two/core', 'two/core.js'),
    node('own', 'two/core', 'one/lib/two/core.js'),
    node('dependency', 'two/core', 'one/lib/two/core.js')
  ).then(complete);
};


if (module == require.main)
  require('test').run(exports);
