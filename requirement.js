/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

function isSingleTerm(requirement) { return requirement.indexOf('/') < 0; }
exports.isSingleTerm = isSingleTerm;

function isLocal(requirement) { return requirement[0] === '.'; }
exports.isLocal = isLocal;

function relativify(path) {
  return path[0] !== '.' ? './' + path : path;
}
exports.relativify = relativify;

function idify(path) {
  return path.substr(-3) === '.js' ? path.substr(0, path.length - 3) : path;
}
exports.idify = idify;

function normalize(path) {
  return relativify(path.substr(-3) === '.js' ? path : path + '.js');
}
exports.normalize = normalize;

