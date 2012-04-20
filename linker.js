/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

var streamer = require('streamer/core'), Stream = streamer.Stream;
var fs = require('fs-streamer/fs');
var path = require('path');

function extract(requirer, path) {
  /**
  Returns stream of requirement records for the given `requirer` in
  the given `path`.
  **/
  var requirements = streamer.zip.all(
    extract.read(requirer, path),
    streamer.repeat(requirer),
    streamer.repeat(path));

  return streamer.map(extract.record, requirements);
}
exports.extract = extract;

extract.parse = new function() {
  var COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g;
  var REQUIRE_PATTERN = /require\s*\(['"]([\w\W]*?)['"]\s*\)/g;
  
  return function parse(source) {
    /**
    Takes file source and extracts all requirement names that are
    found. Returns array of requirement terms
    **/
    var match, result, input;
    input = String(source).replace(COMMENT_PATTERN, '');
    result = [];
    while ((match = REQUIRE_PATTERN.exec(input)))
      result.push(match[1]);
    return result;
  };
};

extract.read = function read(requirer, root) {
  /**
  Function takes module file path and returns stream of it's
  requirements in form of strings.
  **/

  // Read file from the given path.
  var source = fs.read(path.resolve(root || '.', requirer));
  // Map file source to a stream of array of dependency names.
  var names = streamer.map(extract.parse, source);
  // Map arrays to streams and flatten container stream.
  return streamer.flatten(streamer.map(Stream.from, names));
};

extract.record = function record(tuple) {
  /**
   * Creates a record with 'root', 'requirer' and 'requirement' representing
   * a requirement record.
   */
  return {
    root: tuple.pop(),
    requirer: tuple.pop(),
    requirement: tuple.pop()
  };
};

function analyze(requirer, path) {
  /**
  Function takes module requirements stream and returns stream of same
  requirements but with require type annotations.
  **/
  return streamer.map(analyze.annotate, extract(requirer, path));
}
exports.analyze = analyze;

analyze.annotate = function annotate(record) {
  /**
  Function takes module requirement and adds a type annotation to it,
  which is either 'system', 'local' or 'external'.
  */
  var requirement = record.requirement[0];
  var type = requirement[0] === '.' ? 'local' :
             requirement[0] === '@' ? 'system' :
             'external';

  return {
    root: record.root,
    requirer: record.requirer,
    requirement: record.requirement,
    type: type
  };
};


