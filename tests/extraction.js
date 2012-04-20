/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

var linker = require('../linker');
var fixtures = require('./fixtures');

exports.Assert = require('./assert').Assert;
exports['test extract requirements'] = function(expect, complete) {
  var root = fixtures.resolve('a');
  var requirer = './main.js';
  var requirements = linker.extract('./main.js', root);

  expect(requirements).to.be(
    { root: root, requirer: requirer, requirement: './utils' },
    { root: root, requirer: requirer, requirement: '@panel' },
    { root: root, requirer: requirer, requirement: '@devtools/scratchpad' },
    { root: root, requirer: requirer, requirement: 'fs' },
    { root: root, requirer: requirer, requirement: 'tabs' },
    { root: root, requirer: requirer, requirement: 'foo/bar' }).
    then(complete);
};

exports['test analyze requirements'] = function(expect, complete) {
  var root = fixtures.resolve('a');
  var requirer = './main.js';
  var requirements = linker.analyze('./main.js', root);

  expect(requirements).to.be(
    { root: root, requirer: requirer, requirement: './utils', type: 'local' },
    { root: root, requirer: requirer, requirement: '@panel',  type: 'system' },
    { root: root, requirer: requirer, requirement: '@devtools/scratchpad', type: 'system' },
    { root: root, requirer: requirer, requirement: 'fs', type: 'external' },
    { root: root, requirer: requirer, requirement: 'tabs', type: 'external' },
    { root: root, requirer: requirer, requirement: 'foo/bar', type: 'external' }
  ).then(complete);
};

exports['test locate requirements'] = function(expect, complete) {
  var root = fixtures.resolve('a');
  var requirer = './main.js';
  var requirements = linker.locate(linker.analyze('./main.js', root));

  expect(requirements).to.be(
    { root: root, requirer: requirer, requirement: '@panel',  type: 'system' },
    { root: root, requirer: requirer, requirement: '@devtools/scratchpad', type: 'system' },
    { root: root, requirer: requirer, requirement: './utils', type: 'local', path: './utils.js', located: true },
    { root: root, requirer: requirer, requirement: 'fs', type: 'external', path: './fs.js', located: true },
    { root: root, requirer: requirer, requirement: 'tabs', type: 'external', path: './tabs.js', located: true },
    { root: root, requirer: requirer, requirement: 'foo/bar', type: 'external', path: './foo/bar.js', located: true }
  ).then(complete);
};

if (module == require.main)
  require('test').run(exports);
