/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var Stream = require('streamer/core').Stream;
var requirement = require('../requirement'),
    normalize = requirement.normalize, isMultiterm = requirement.isMultiterm;
var existing = require('../io').existing;
var path = require('path');

function search(requirement, jetpackPath) {
  /**
  Searches module in the standard library and returns stream that either
  contains path to the searched requirement or is empty if module is not
  found.
  **/
  requirement = isMultiterm(requirement) ? requirement : 'sdk/' + requirement;
  var modulePath = path.join(jetpackPath, 'lib', normalize(requirement));
  return existing(Stream.of(modulePath));
}
exports.search = search;
