/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var path = require('../support/path');
var normalize = require('../requirement').normalize;
var existing = require('../io').existing;
var streamer = require('../support/streamer/core'),
    Stream = streamer.Stream, append = streamer.append, map = streamer.map;

function foundNode(requirement, type, path) {
  /**
  create module node with `requirement`, `path` and `type` information.
  Node type will be same as requirer type since it's local to requirer.
  **/
  return { requirement: requirement, path: path, type: type };

}
function errorNode(requirement, searchPath, requirerPath, type) {
  return {
    error: 'Module required by: `' + requirerPath +
           ' as `require("' + requirement + '")`' +
           ' was not found at: ' + searchPath,
    type: type,
    path: searchPath,
    requirement: requirement
  };
}

function search(requirement, requirerPath, requirerType) {
  /**
  Function takes relative require term as `requirement` string, requirer
  module path and type. And returns stream of discovered matches in order
  of preference. At the end of the stream there is always an error node
  containing `error` message indicating error. If there is no matching node
  error node will be the first match.
  **/

  // Resolve base directory of the requirer.
  var basePath = path.dirname(requirerPath);
  // Resolve file path where requirement must be located.
  var searchPath = path.join(basePath, normalize(requirement));

  // Get a stream of verified file paths, in this case it's either stream
  // of single item `file` or empty. Later would mean that file was not found.
  var discoveredPaths = existing(Stream.of(searchPath));

  // We create nodes for the distributed `requirement` with a `path`
  // information and type information. Node type will be just inherited
  // from `requirer` since
  var makeNode = foundNode.bind(foundNode, requirement, requirerType);
  var foundNodes = map(makeNode, discoveredPaths);
  var notFound = errorNode(requirement, searchPath, requirerPath, requirerType);

  // We append `notFound` node to the end of the `nodes` stream. This way
  // if stream is `nodes` stream is empty node with error will be the first
  // match.
  return append(foundNodes, Stream.of(notFound));
}
exports.search = search;
