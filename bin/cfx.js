/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

var streamer = require('streamer/core');
var linker = require('../linker');
var util = require('util');

var unbind = Function.call.bind(Function.bind, Function.call);
var slice = unbind(Array.prototype.slice);

function main(name, rest) {
  console.log(process.argv)
  rest = slice(arguments, 1);
  var f = linker[name];
  streamer.print(streamer.map(function($) {
    return '\n' + JSON.stringify($, '  ', '  ');
  }, f.apply(f, rest)));
}
exports.main = main;

if (require.main === module)
  main.apply(main, process.argv.slice(2));