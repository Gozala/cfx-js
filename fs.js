/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

// This is temporary workaround for the cfx-py as it does no searches
// in the `node_modules`. cfx-js will pick them up from there instead.
module.exports = require("sdk/io/fs");
