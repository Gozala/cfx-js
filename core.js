/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint node: true globalstrict: true */

'use strict';

var path = require('path');
var streamer = require('./support/streamer/core'),
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
var graphUtils = require('./graph'),
    idify = graphUtils.idify, stripRequirement = graphUtils.stripRequirement,
    addRequirements = graphUtils.addRequirements,
    serialize = graphUtils.serialize;




function link(mainPath, addonPath, jetpackPath, options) {
  options = options || {};
  // Folder to look dependencies for may be passed via option
  // `options.dependenciesDirectory`. If omitted fall back to 'node_modules'.
  var dependenciesDirectory = options.dependenciesDirectory || 'node_modules';
  // By default search is backwards incompatible, but compatibility can be
  // turned on to ease migration.
  var backwardsCompatible = options.backwardsCompatible || false;
  // CFX takes an option for additional packages paths that can be passed to
  // a linker via `options.packagesPaths` if omitted `packages` from add-on
  // sdk is used.
  var packagesPaths = options.packagesPaths ||
                      [ path.join(jetpackPath, 'packages') ];

  // Analyze addon path in order to obtain package descriptor information.
  var addonDescriptor = descriptor(addonPath);
  // Create stream of package descriptors that will be used for backwards
  // compatible searches.
  var packageDescriptors = append(addonDescriptor, descriptors(packagesPaths));

  // Make entry point module node.
  var modulePath = path.join(addonPath, mainPath);
  var module = {
    type: 'local',
    path: modulePath,
    id: identify(modulePath, 'local', addonPath, jetpackPath)
  };

  return serialize(graph(module, [], {
    rootPath: addonPath,
    jetpackPath: jetpackPath,
    dependenciesDirectory: dependenciesDirectory,
    backwardsCompatible: backwardsCompatible,
    packagesPaths: packagesPaths,
    packageDescriptors: packageDescriptors
  }));
}
exports.link = link;

function graph(node, visited, options) {
  visited.push(node.id);
  var requirerPath = node.path;
  var requirerType = node.type;

  var requirements = requirerType === 'system' ? Stream.empty :
                     node.error ? Stream.empty :
                     read(requirerPath);

  // Expand each requirement of the given module to a node containing
  // information about it's location & type.
  var requirementNodes = expand(function(requirement) {
    return search(requirement, requirerPath, requirerType, options);
  }, requirements);

  // This step add's `id` property with unique value identifying
  // module.
  var identified = idify(requirementNodes, options);
  var requirer = addRequirements(node, identified);
  var dependencies = stripRequirement(identified);
  // Filter out dependencies that have not being visited yet.
  var newDependencies = filter(function(dependency) {
    return visited.indexOf(dependency.id) < 0;
  }, dependencies);

  // Expand new dependencies to their sub graphs.
  var subGraph = expand(function(dependency) {
    return graph(dependency, visited, options);
  }, newDependencies);

  return append(requirer, subGraph);
}
