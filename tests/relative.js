/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var linker = require('../linker');
var fixtures = require('./fixtures');
var root = fixtures.resolve('reliant/lib');

exports.Assert = require('./assert').Assert;

exports['test ./foo -> ./bar'] = function(expect, complete) {
  var actual = linker.locate.relative.find('./bar.js', './foo.js', root);
  var expected = fixtures.resolve('reliant/lib/bar.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test ./bar -> ./utils/baz'] = function(expect, complete) {
  var actual = linker.locate.relative.find('./utils/baz.js', './bar.js', root);
  var expected = fixtures.resolve('reliant/lib/utils/baz.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test ./utils/baz -> ../beep'] = function(expect, complete) {
  var actual = linker.locate.relative.find('../beep.js', './utils/baz.js', root);
  var expected = fixtures.resolve('reliant/lib/beep.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test ./utils/baz -> ../misc/qux'] = function(expect, complete) {
  var actual = linker.locate.relative.find('../misc/qux.js', './utils/baz.js', root);
  var expected = fixtures.resolve('reliant/lib/misc/qux.js');

  expect(actual).to.be(expected).then(complete);
};


if (module == require.main)
  require('test').run(exports);
