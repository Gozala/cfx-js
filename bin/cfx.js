/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('streamer/core');
var link = require('../core').link;

var unbind = Function.call.bind(Function.bind, Function.call);
var slice = unbind(Array.prototype.slice);

function main(name, mainPath, jetpackPath, rest) {
  var addonPath = process.cwd();
  rest = slice(arguments, 3);
  var options = { backwardsCompatible: rest.indexOf('--compatible') >= 0 };

  streamer.print(streamer.map(function($) {
    return '\n' + JSON.stringify($, 2, 2);
  }, link(mainPath, addonPath, jetpackPath, options)));
}
exports.main = main;

if (require.main === module)
  main.apply(main, process.argv.slice(1));
