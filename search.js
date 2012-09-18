/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var requirement = require('./requirement'),
    isLocal = requirement.isLocal;
var local = require('./search/local');
var external = require('./search/external');
var std = require('./search/std');
var deprecated = require('./search/deprecated');
var system = require('./search/system');
var streamer = require('./support/streamer/core'),
    Stream = streamer.Stream, append = streamer.append, take = streamer.take;


function search(requirement, requirerPath, requirerType, options) {
  var matches = isLocal(requirement) ? local.search(requirement, requirerPath,
                                                    requirerType)
                                     : searchNonLocal(requirement, requirerPath,
                                                      requirerType, options);
  return take(1, matches);
}
exports.search = search;

function searchNonLocal(requirement, requirerPath, requirerType, options) {
  var rootPath = options.rootPath;
  var dependenciesDirectory = options.dependenciesDirectory || 'node_modules';
  var jetpackPath = options.jetpackPath;
  var backwardsCompatible = options.backwardsCompatible;
  var packageDescriptors = options.packageDescriptors;

  // Append stream of in ordered of preference, this way first match will
  // be the best one.
  return append.all(
    external.search(requirement, requirerPath, rootPath, dependenciesDirectory),
    std.search(requirement, jetpackPath),
    backwardsCompatible ? deprecated.search(requirement, packageDescriptors,
                                            rootPath)
                        : Stream.empty,
    system.search(requirement));
}
