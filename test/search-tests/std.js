/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var search = require('../../search/std').search;
var fixtures = require('../fixtures');
var streamer = require('../../support/streamer/core'),
    map = streamer.map;

exports.Assert = require('../assert').Assert;

var modulesDirectory = 'node_modules';
var jetpackPath = fixtures.resolve('JETPACK_PATH', '2.0');

function makePath() {
  var givePath = Array.prototype.slice.call(arguments);
  var fullPath = [ 'JETPACK_PATH', '2.0', 'lib' ].concat(givePath);
  return fixtures.resolve.apply(null, fullPath);
}

function makeNode(requirement, path) {
  return { requirement: requirement, path: path, type: 'std' };
}

exports['test seach low level module'] = function(expect, complete) {
  var modulePath = makePath('sdk', 'core', 'heritage.js');
  var searchTerm = 'sdk/core/heritage';

  var actual = search(searchTerm, jetpackPath);

  expect(actual).to.be(makeNode(searchTerm, modulePath)).then(complete);
};

exports['test seach high level module`'] = function(expect, complete) {
  var modulePath = makePath('sdk', 'panel.js');
  var searchTerm = 'panel';

  var actual = search(searchTerm, jetpackPath);

  expect(actual).to.be(makeNode('sdk/panel', modulePath)).then(complete);
};

exports['test missing dependency'] = function(expect, complete) {
  var searchTerm = 'not/found';

  var actual = search(searchTerm, jetpackPath);

  expect(actual).to.be.empty().then(complete);
};


if (module == require.main)
  require('test').run(exports);
