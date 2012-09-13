/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var path = require('./support/path');

function isMultiterm(requirement) {
  /**
  Returns `true` if the requirement is a multi-term (contains a slash `/`)
  such as `require('package/module/path')`. Otherwise return false.
  **/

  return requirement.indexOf('/') >= 0;
}
exports.isMultiterm = isMultiterm;

function isLocal(requirement) { return requirement[0] === '.'; }
exports.isLocal = isLocal;

function relativify(path) {
  return path[0] !== '.' ? './' + path : path;
}
exports.relativify = relativify;

function stripExtension(path) {
  return path.substr(-3) === '.js' ? path.substr(0, path.length - 3) : path;
}
exports.stripExtension = stripExtension;

function normalize(path) {
  return path.substr(-3) === '.js' ? path : path + '.js';
}
exports.normalize = normalize;

function identify(location, type, rootPath, jetpackPath) {
  return stripExtension(
    type === 'local' ? relativify(path.relative(rootPath, location)) :
    type === 'external' ? relativify(path.relative(rootPath, location)) :
    type === 'std' ? path.relative(path.join(jetpackPath, 'lib'), location) :
    type === 'system' ? location :
    type === 'deprecated' ? location :
    null);
}
exports.identify = identify;
