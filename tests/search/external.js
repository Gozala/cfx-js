/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var search = require('../../search/external').search;
var fixtures = require('../fixtures');
var streamer = require('../../support/streamer/core'),
    map = streamer.map;

exports.Assert = require('../assert').Assert;

var modulesDirectory = 'node_modules';

function node(requirement, path) {
  return { type: 'external', path: path, requirement: requirement };
}
exports['test existing external dependency'] = function(expect, complete) {
  var rootPath = fixtures.resolve('a');
  var requirerPath = fixtures.resolve('a', 'main.js');
  var modulePath = fixtures.resolve('a', modulesDirectory, 'fs.js');
  var searchTerm = 'fs';

  var actual = search(searchTerm, requirerPath, rootPath, modulesDirectory);

  expect(actual).to.be(node(searchTerm, modulePath)).then(complete);
};

exports['test missing external dependency'] = function(expect, complete) {
  var rootPath = fixtures.resolve('a');
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchTerm = 'not-found';

  var actual = search(searchTerm, requirerPath, rootPath, modulesDirectory);

  expect(actual).to.be.empty().then(complete);
};

exports['test does not finds itself'] = function(expect, complete) {
  var rootPath = fixtures.resolve('a');
  var requirerPath = fixtures.resolve('a', modulesDirectory, 'fs.js');
  var searchTerm = 'fs';

  var actual = search(searchTerm, requirerPath, rootPath, modulesDirectory);

  expect(actual).to.be.empty().then(complete);
};


if (module == require.main)
  require('test').run(exports);
