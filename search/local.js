/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var path = require('path');
var normalize = require('../requirement').normalize;
var existing = require('../io').existing;
var streamer = require('streamer/core'),
    Stream = streamer.Stream, append = streamer.append, map = streamer.map;

function search(requirement, requirerPath) {
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
  return existing(Stream.of(searchPath));
}
exports.search = search;
