/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('../support/streamer/core'),
    Stream = streamer.Stream, map = streamer.map;
var normalize = require('../requirement').normalize;
var existing = require('../io').existing;
var path = require('path');

function search(requirement, requirerPath, rootPath, dependenciesDirectory) {
  var basePath = path.dirname(requirerPath);
  var modulePath = normalize(requirement);
  var directoryPaths = lookups(requirerPath, rootPath, dependenciesDirectory);
  var seachPaths = directoryPaths.map(function(directory) {
    return path.join(directory, normalize(modulePath));
  }).
  // Make sure that module requirement does not requires itself.
  // For example module from 'my-addon/@modules/tabs.js' may require
  // 'tabs' module, that should be `tabs` system module rather than
  // 'my-addon/@modules/tabs.js' itself.
  filter(function(path) { return path !== requirerPath; });

  // Create a lazy stream of existing paths. Stream elements are ordered
  // by a best match, there for first item in stream is a best match. If
  // stream is empty module is not found.
  var found = existing(Stream.from(seachPaths));

  return map(function(path) {
    return {
      path: path,
      requirement: requirement,
      type: 'external'
    };
  }, found);
}
exports.search = search;

function lookups(requirerPath, rootPath, dependenciesDirectory) {
  /**
  Function takes `requirerPath` add-on's `rootPath` and `dependenciesDirectory`
  and returns array of dependency directory paths ordered by length.
  **/

  // Resolve path relative to addon root path.
  return path.relative(rootPath, requirerPath).
    // split path into parts.
    split(/\/|\\/).
    // take path as array in form of `[ 'path', 'to', 'thing' ]`
    // and map that to array of parent directory paths like:
    // [
    //  [ 'path', 'to', 'thing' ],
    //  [ 'path', 'to' ],
    //  [ 'path' ],
    //  []
    // ]
    reduce(function(result, entry) {
      return [ result[0].concat([ entry ]) ].concat(result);
    }, [[]]).
    // Join element arrays back to paths.
    // [ 'path/to/thing', 'path/to', 'path', '' ]
    map(function(parts) {
      return path.join.apply(path, parts);
    }).
    // convert paths to full paths and append dependencies directory:
    // [
    //  '/addon/path/to/thing/node_modules',
    //  '/addon/path/to/node_modules',
    //  '/addon/path/node_modules',
    //  '/addon/node_modules'
    // ]
    map(function(directory) {
      return path.join(rootPath, directory, dependenciesDirectory);
    });
}
exports.lookups = lookups;
