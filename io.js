/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('streamer/core'),
    Stream = streamer.Stream, capture = streamer.capture,
    expand = streamer.expand, zip = streamer.zip, filter = streamer.filter,
    map = streamer.map;
var fs = require('fs-streamer/fs');
var reactive = require('./reactive'),
    field = reactive.field;
var stream = require('./stream'),
    select = stream.select;

function stat(path) {
  return capture(function() { return Stream.of(null); }, fs.stat(path));
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


