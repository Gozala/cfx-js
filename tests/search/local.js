/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var search = require('../../search/local').search;
var fixtures = require('../fixtures');
var streamer = require('streamer/core'),
    map = streamer.map;

exports.Assert = require('../assert').Assert;
exports['test find relative in same dir'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var modulePath = fixtures.resolve('a', 'utils.js');
  var searchTerm = './utils';

  var actual = search(searchTerm, requirerPath);

  expect(actual).to.be(modulePath).then(complete);
};

exports['test find missing module'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchTerm = './not-found';

  var actual = search(searchTerm, requirerPath);

  expect(actual).to.be.empty().then(complete);
};

exports['test find relative upper dir'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'node_modules', 'foo', 'bar.js');
  var modulePath = fixtures.resolve('a', 'node_modules', 'foo.js');
  var searchTerm = '../foo';

  var actual = search(searchTerm, requirerPath);

  expect(actual).to.be(modulePath).then(complete);
};

exports['test nested dir'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var modulePath = fixtures.resolve('a', 'node_modules', 'foo', 'bar.js');
  var searchTerm = './node_modules/foo/bar';

  var actual = search(searchTerm, requirerPath);

  expect(actual).to.be(modulePath).then(complete);
};


if (module == require.main)
  require('test').run(exports);
