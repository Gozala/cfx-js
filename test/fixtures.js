/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var path = require("path");
var env = require("sdk/system/environment").env;
var resolve = module.filename ? // node
                path.resolve.bind(path, module.filename, "..", "fixtures") :
                path.resolve.bind(path, env.CUDDLEFISH_ROOT, "cfx", "test", "fixtures");

exports.resolve = resolve
