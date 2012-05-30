/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var linker = require('../linker');
var fixtures = require('./fixtures');
var env = require('environment').env;

exports.Assert = require('./assert').Assert;

var JETPACK_PATH_18 = fixtures.resolve('JETPACK_PATH/1.8');
var JETPACK_PATH_20 = fixtures.resolve('JETPACK_PATH/2.0');
var ROOT = fixtures.resolve('a');

exports['test main -> panel'] = function(expect, complete) {
  env.JETPACK_PATH = JETPACK_PATH_18;

  var actual = linker.locate.system.find('panel.js', './main.js', ROOT);
  var expected = fixtures.resolve('JETPACK_PATH/1.8/packages/addon-kit/lib/panel.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test main -> tabs'] = function(expect, complete) {
    env.JETPACK_PATH = JETPACK_PATH_18;

  var actual = linker.locate.system.find('tabs.js', './main.js', ROOT);
  var expected = fixtures.resolve('JETPACK_PATH/1.8/packages/addon-kit/lib/tabs.js');

  expect(actual).to.be(expected).then(complete);
};

if (module == require.main)
  require('test').run(exports);
