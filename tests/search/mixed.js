/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var search = require('../../search').search;
var fixtures = require('../fixtures');
var streamer = require('streamer/core'),
    map = streamer.map;

exports.Assert = require('../assert').Assert;

var modulesDirectory = 'node_modules';
var jetpackPath = fixtures.resolve('JETPACK_PATH', '2.0');

function makePath() {
  var givePath = Array.prototype.slice.call(arguments);
  var fullPath = [ 'JETPACK_PATH', '2.0', 'lib' ].concat(givePath);
  return fixtures.resolve.apply(null, fullPath);
}

function makeNode(requirement, path, type) {
  return { requirement: requirement, path: path, type: type };
}

function error(requirement, searchPath, requirerPath, type) {
  return {
    error: 'Module required by: `' + requirerPath +
           ' as `require("' + requirement + '")`' +
           ' was not found at: ' + searchPath,
    path: searchPath,
    requirement: requirement,
    type: type
  };
}

exports['test search local from local'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var modulePath = fixtures.resolve('a', 'utils.js');
  var searchTerm = './utils';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeNode(searchTerm, modulePath, 'local')).then(complete);

};


exports['test seach std module'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var modulePath = makePath('sdk', 'core', 'heritage.js');
  var searchTerm = 'sdk/core/heritage';


  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeNode(searchTerm, modulePath, 'std')).then(complete);
};

exports['test seach external std overlay'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var modulePath = fixtures.resolve('a', 'node_modules', 'sdk', 'tabs.js');
  var searchTerm = 'sdk/tabs';


  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeNode(searchTerm, modulePath, 'external')).then(complete);
};


exports['test search shortcut has no overlay'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var modulePath = makePath('sdk', 'tabs.js');
  var searchTerm = 'tabs';


  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeNode('sdk/tabs', modulePath, 'std')).then(complete);
};



if (module == require.main)
  require('test').run(exports);
