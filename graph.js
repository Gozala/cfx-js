/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint node: true globalstrict: true */

'use strict';

var path = require('path');
var streamer = require('streamer/core'),
    Stream = streamer.Stream, append = streamer.append, expand = streamer.expand,
    map = streamer.map, filter = streamer.filter, reduce = streamer.reduce;
var search = require('./search').search;
var extract = require('./extract'),
    read = extract.read, parse = extract.parse;
var deprecated = require('./search/deprecated'),
    descriptor = deprecated.descriptor, descriptors = deprecated.descriptors;
var reactive = require('./reactive'),
    join = reactive.join;
var requirement = require('./requirement'),
    identify = requirement.identify;

function idify(nodes, options) {
  /**
  Adds node unique identifier to the given nodes.
  **/
  return map(function(node) {
    return join(node, {
      id: identify(node.path, node.type,
                   options.rootPath, options.jetpackPath)
    });
  }, nodes);
}
exports.idify = idify;

function stripRequirement(nodes) {
  /**
  Strips out temporary requirement field from module nodes.
  **/
  return map(function(node) {
    return join(node, { requirement: undefined });
  }, nodes);
}
exports.stripRequirement = stripRequirement;

function addRequirements(node, dependencies) {
  /**
  Utility function that adds requirements mapping to the given module
  node.
  **/
  return reduce(function(node, dependency) {
    node.requirements[dependency.requirement] = dependency.id;
    return node;
  }, dependencies, join(node, { requirements: {} }));
}
exports.addRequirements = addRequirements;

function serialize(nodes) {
  return reduce(function(graph, node) {
    graph[node.id] = node;
    return graph;
  }, nodes, {});
}
exports.serialize = serialize;
