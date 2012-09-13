/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('./support/streamer/core'),
    Stream = streamer.Stream, map = streamer.map, expand = streamer.expand;
var fs = require('./support/fs-streamer/fs');



var parse = new function() {
  var COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g;
  var REQUIRE_PATTERN = /require\s*\(['"]([\w\~\`\!\@\#\$\%\^\&\-\=\+\.\,\/\;\(\)\[\]\{\}\ ]*?)['"]\s*\)/g;

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
exports.parse = parse;

function read(path) {
  /**
  Function takes module file path and returns stream of it's
  requirements in form of strings.
  **/

  // Read file from the given path.
  var source = fs.read(path);
  // Map file source to a stream of array of dependency names.
  var names = map(parse, source);
  // Map arrays to streams and flatten container stream.
  return expand(Stream.from, names);
}
exports.read = read;
