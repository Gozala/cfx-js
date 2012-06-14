/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('streamer/core'),
    Stream = streamer.Stream, map = streamer.map, filter = streamer.filter,
    expand = streamer.expand, zip = streamer.zip, capture = streamer.capture,
    mix = streamer.mix, append = streamer.append, take = streamer.take,
    reduce = streamer.reduce;

var reactive = require('./reactive'),
    field = reactive.field, join = reactive.join,
    is = reactive.is, isnt = reactive.isnt, value = reactive.value,
    identity = reactive.identity;


function select(f, source) {
  /**
  Takes `source` stream and maps each item using `f` function that is expected
  to return stream. If first item of that stream is `truthy` item is contained
  in resulting stream, otherwise it's omitted.
  **/
  var selector = expand(function(item) { return take(1, f(item)); }, source);
  var zipped = zip(selector, source);
  var selected = filter(field(0), zipped);
  return map(field(1), selected);
}
exports.select = select;

function sort(f, stream) {
  var sorted = reduce(function(result, value) {
    return result.concat([ value ]).sort(f);
  }, stream, []);
  return expand(Stream.from, sorted);
}
exports.sort = sort;
