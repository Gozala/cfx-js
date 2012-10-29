/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint node: true globalstrict: true */

"use strict";

exports["test search local"] = require("./search-tests/local");
exports["test search deprecated"] = require("./search-tests/deprecated");
exports["test search external"] = require("./search-tests/external");
exports["test search std"] = require("./search-tests/std");
exports["test search mixed"] = require("./search-tests/mixed");

require("test").run(exports);
