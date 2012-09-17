/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var Stream = require('../support/streamer/core').Stream;
var normalize = require('../requirement').normalize;

function search(requirement) {
  /**
  System modules are shipped with a platform and we have no way of testing
  weather module is shipped or not, so we just assume it is.
  **/
  return Stream.of({
    requirement: requirement,
    type: 'system',
    path: normalize(requirement)
  });
}
exports.search = search;
