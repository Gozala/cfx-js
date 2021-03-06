/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('./support/streamer/core'),
    Stream = streamer.Stream, capture = streamer.capture,
    expand = streamer.expand, zip = streamer.zip, filter = streamer.filter,
    map = streamer.map;
var fs = require('./support/fs-streamer/fs');
var reactive = require('./reactive'),
    field = reactive.field;
var stream = require('./stream'),
    select = stream.select;

function stat(path) {
  /**
  Take `path` and return stream containing single item: File `stats` if it
  exists or `null` if it isn't.
  **/
  return capture(function() {
    // If `fs.stat` errors than it means file does not exists, recover
    // with `null` stream in such case.
    return Stream.of(null);
  }, fs.stat(path));
}
exports.stat = stat;

function existing(paths) {
  /**
  Reduces given stream of `paths` to an existing subset. Returned stream is
  lazy, meaning that IO operations are performed at consumption, so that if
  you stop on first match only operations for up to first match will be
  performed.
  **/
  return select(stat, paths);
}
exports.existing = existing;


