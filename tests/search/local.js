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

function node(path, type) {
  return { path: path, type: type };
}

function error(requirement, searchPath, requirerPath, type) {
  return {
    error: 'Module required by: `' + requirerPath +
           ' as `require("' + requirement + '")`' +
           ' was not found at: ' + searchPath,
    path: searchPath,
    type: type
  };
}

exports['test find relative in same dir'] = function(expect, complete) {
  var requirerType = 'local';
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchPath = fixtures.resolve('a', 'utils.js');
  var searchTerm = './utils';

  var actual = search(searchTerm, requirerPath, requirerType);

  expect(actual).to.be(
    node(searchPath, requirerType),
    error(searchTerm, searchPath, requirerPath, requirerType)).then(complete);
};

exports['test find missing module'] = function(expect, complete) {
  var requirerType = 'local';
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchPath = fixtures.resolve('a', 'not-found.js');
  var searchTerm = './not-found';

  var actual = search(searchTerm, requirerPath, requirerType);

  expect(actual).to.be(
    error(searchTerm, searchPath, requirerPath, requirerType)).then(complete);
};

exports['test find relative upper dir'] = function(expect, complete) {
  var requirerType = 'external';
  var requirerPath = fixtures.resolve('a', 'node_modules', 'foo', 'bar.js');
  var searchPath = fixtures.resolve('a', 'node_modules', 'foo.js');
  var searchTerm = '../foo';

  var actual = search(searchTerm, requirerPath, requirerType);

  expect(actual).to.be(
    node(searchPath, requirerType),
    error(searchTerm, searchPath, requirerPath, requirerType)).then(complete);
};

exports['test nested dir'] = function(expect, complete) {
  var requirerType = 'local';
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchPath = fixtures.resolve('a', 'node_modules', 'foo', 'bar.js');
  var searchTerm = './node_modules/foo/bar';

  var actual = search(searchTerm, requirerPath, requirerType);

  expect(actual).to.be(
    node(searchPath, requirerType),
    error(searchTerm, searchPath, requirerPath, requirerType)).then(complete);
};


if (module == require.main)
  require('test').run(exports);
