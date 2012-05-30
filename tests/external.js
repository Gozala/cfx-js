/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var linker = require('../linker');
var fixtures = require('./fixtures');

exports.Assert = require('./assert').Assert;

exports['test main -> foo/bar'] = function(expect, complete) {
  var root = fixtures.resolve('a');

  var actual = linker.locate.external.find('foo/bar.js', './main.js', root);
  var expected = fixtures.resolve('a/@modules/foo/bar.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test main -> fs'] = function(expect, complete) {
  var root = fixtures.resolve('a');

  var actual = linker.locate.external.find('fs.js', './main.js', root);
  var expected = fixtures.resolve('a/@modules/fs.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test main -> tabs'] = function(expect, complete) {
  var root = fixtures.resolve('a');

  var actual = linker.locate.external.find('fs.js', './main.js', root);
  var expected = fixtures.resolve('a/@modules/fs.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test foo/bar -> fs'] = function(expect, complete) {
  var root = fixtures.resolve('b');

  var actual = linker.locate.external.find('fs.js', './@modules/foo/bar.js', root);
  var expected = fixtures.resolve('b/@modules/fs.js');

  expect(actual).to.be(expected).then(complete);
};

exports['test foo/bar -> baz'] = function(expect, complete) {
  var root = fixtures.resolve('b');

  var actual = linker.locate.external.find('baz.js', './@modules/foo/bar.js', root);
  var expected = fixtures.resolve('b/@modules/foo/@modules/baz.js');

  expect(actual).to.be(expected).then(complete);
};



if (module == require.main)
  require('test').run(exports);
