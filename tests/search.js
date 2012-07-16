/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

exports['test search local'] = require('./search/local');
exports['test search deprecated'] = require('./search/deprecated');
exports['test search external'] = require('./search/external');
exports['test search std'] = require('./search/std');
exports['test search mixed'] = require('./search/mixed');


if (module == require.main)
  require("test").run(exports);
