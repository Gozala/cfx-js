/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var search = require('../../search').search;
var descriptors = require('../../search/deprecated').descriptors;

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

function makeDep(requirement, path, type) {
  return {
    requirement: requirement,
    path: path,
    type: 'deprecated',
    warning: { type: type }
  };
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

function makePackageDescriptors() {
  return descriptors([
    fixtures.resolve('JETPACK_PATH', '1.8', 'packages')
  ]);
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

exports['test local not found'] = function(expect, complete) {
  var requirerType = 'local';
  var requirerPath = fixtures.resolve('a', 'main.js');
  var searchPath = fixtures.resolve('a', 'not-found.js');
  var searchTerm = './not-found';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: true
  });


  expect(actual).to.be(
    error(searchTerm, searchPath, requirerPath, requirerType)).then(complete);
};

exports['test local to std'] = function(expect, complete) {
  var requirerType = 'std';
  var requirerPath = makePath('sdk', 'panel.js');
  var modulePath = makePath('sdk', 'tabs.js');
  var searchTerm = './tabs';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '2.0'),
    backwardsCompatible: false
  });

  expect(actual).to.be(makeNode(searchTerm, modulePath, 'std')).then(complete);
};


exports['test search std module'] = function(expect, complete) {
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

exports['test search external std overlay'] = function(expect, complete) {
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

exports['test search deprecated relative'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('a', 'utils.js');
  var searchTerm = 'utils';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeNode('a/utils', findPath, 'deprecated')).then(complete);
};

exports['test search deprecated core'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'addon-kit', 'lib', 'panel.js');
  var searchTerm = 'panel';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('panel', findPath, 'core')).then(complete);
};

exports['test search deprecated packaged'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'addon-kit', 'lib', 'tabs.js');
  var searchTerm = 'addon-kit/tabs';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('addon-kit/tabs', findPath, 'packaged')).then(complete);
};

exports['test search deprecated main (relative)'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'five', 'lib', 'main.js');
  var searchTerm = 'five';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('five', findPath, 'main')).then(complete);
};


exports['test search deprecated main (absolute)'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'four', 'lib', 'main.js');
  var searchTerm = 'four';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('four', findPath, 'main')).then(complete);
};

exports['test search deprecated main (absolute)'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'four', 'lib', 'main.js');
  var searchTerm = 'four';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('four', findPath, 'main')).then(complete);
};

exports['test search deprecated main (defaults)'] = function(expect, complete) {
  var requirerPath = fixtures.resolve('a', 'main.js');
  var requirerType = 'local';
  var findPath = fixtures.resolve('JETPACK_PATH', '1.8', 'packages',
                                  'three', 'lib', 'main.js');
  var searchTerm = 'three';

  var actual = search(searchTerm, requirerPath, requirerType, {
    rootPath: fixtures.resolve('a'),
    jetpackPath: fixtures.resolve('JETPACK_PATH', '1.8'),
    packageDescriptors: makePackageDescriptors(),
    backwardsCompatible: true
  });

  expect(actual).to.be(makeDep('three', findPath, 'main')).then(complete);
};

if (module == require.main)
  require('test').run(exports);
