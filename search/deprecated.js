/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var reactive = require('../reactive'),
    field = reactive.field, join = reactive.join,
    is = reactive.is, isnt = reactive.isnt, value = reactive.value,
    identity = reactive.identity, query = reactive.query, is = reactive.is,
    and = reactive.and, or = reactive.or, method = reactive.method;

var requirement = require('../requirement'),
    isLocal = requirement.isLocal, normalize = requirement.normalize,
    idify = requirement.idify, relativify = requirement.relativify,
    isMultiterm = requirement.isMultiterm;

var stream = require('../stream'),
    select = stream.select, sort = stream.sort;

var streamer = require('../support/streamer/core'),
    Stream = streamer.Stream, map = streamer.map, filter = streamer.filter,
    expand = streamer.expand, zip = streamer.zip, capture = streamer.capture,
    mix = streamer.mix, append = streamer.append, take = streamer.take,
    reduce = streamer.reduce;

var io = require('../io'),
    existing = io.existing;

var fs = require('../support/fs-streamer/fs');
var path = require('path');

function extractPackageName(requirement) {
  /**
  Extracts package `name` from the multi-term `requirement`.
  **/
  return requirement.split('/').shift();
}
exports.extractPackageName = extractPackageName;

function extractModulePath(requirement) {
  /**
  Extracts module `path` with in the package from the multi-term `requirement`.
  **/
  return requirement.split('/').slice(1).join('/');
}
exports.extractModulePath = extractModulePath;

function search(requirement, descriptors, rootPath) {
  var named = isMultiterm(requirement) ?
    // If the requirement is a multi-term (contains a slash `/`) such
    // as `require('package/module/path')`, the loader interprets first
    // term `package` as a package `name`. If there is such a package, it
    // interprets the rest of the name `modue/path` as a module path relative
    // to the top of that package. The `lib` key of `package.json` for that
    // package is used to determine package root, which defaults to `./lib`.
    // This will look for `JETPACK_PATH/packages/package/lib/module/path.js`.
    // If such module is discovered return stream will contain entry for it,
    // otherwise it will be empty.
    map(mark.packaged(requirement), search.packaged(requirement, descriptors)) :
    // If requirement is a single-term (does not contain a slash `/`), linker
    // attempts to interpret it as a requirement of the entry point module from
    // the package with a given `name`. Entry point module is specified by
    // `main` property of the package.  If there is no package by that name,
    // returned stream will be empty.
    map(mark.main(requirement), search.main(requirement, descriptors));

  // The require term (either a single-term, or multi-term) is used as the
  // subject of a search. At first search looks into SDKs core modules. If
  // module is not discovered stream will be empty.
  var core = map(mark.core(requirement), search.core(requirement, descriptors));

  // Then it searches in the add-on package itself. If module is not discovered
  // returned stream will be empty.
  var own = map(mark.own(requirement), search.own(requirement, descriptors, rootPath));

  // Finally it searches in all the dependency packages (if no dependencies are
  // declared all packages are treated as dependencies). If module is not
  // discovered stream will be empty.
  var dependency = map(mark.dependency(requirement),
                       search.dependency(requirement, descriptors));

  // Concatenate all results in an order of priority. Note that each step
  // (including the following one) returns a lazy stream, there for
  // `take(1, result)` will only perform IO up to first match, which also
  // will be a best match.
  return append.all(named, core, own, dependency);
}
exports.search = search;

function descriptor(directory) {
  /**
  Takes package `path` and returns stream of single item representing enclosed
  package descriptor (parsed package.json) with additional `linker.path`
  property representing path to package directory. If path is invalid (it's not
  a package path, or `package.json` can not be parsed) item will only contain
  `error` and `linker.path` properties.
  **/

  // Resolve descriptor path.
  var file = path.join(directory, 'package.json');
  // Read file content.
  var content = fs.read(file);

  // Parse descriptor and add `linker.path` that point to the package
  // directory.
  var metadata = map(function(source) {
    return join(JSON.parse(source), {
      linker: { path: directory } });
  }, content);

  // If reading or parsing failed, package is invalid and we return descriptor
  // with `error` massage and `linker.path` property.
  return capture(function() {
    return Stream.of({
      error: 'Invalid package',
      linker: { path: directory }
    });
  }, metadata);
}
exports.descriptor = descriptor;

function descriptors(paths) {
  /**
  Takes array of `packages` directories and returns stream of nodes containing
  `path` to the package and it's parsed `descriptor`.
  **/

  // Since each path is directory for packages we create stream of all package
  // directories by listing entries of each one.
  var locations = expand(function(directory) {
    var entries = fs.list(directory);
    return map(function(entry) {
      return path.join(directory, entry);
    }, entries);
  }, Stream.from(paths));

  // expand each path to it's stats and filter out only ones that are
  // directories.
  var stats = filter(method('isDirectory'), expand(fs.stat, locations));
  // Finally map stats back to paths.
  var directories = map(field('path'), stats);

  // Now all package directories paths are expected to it's descriptors.
  return expand(descriptor, directories);
}
exports.descriptors = descriptors;

search.from = function(requirement, descriptors) {
  /**
  Searches for a given requirement in given package descriptors. `requirement`
  is assumed to be a relative path with in the package. Returns stream of paths
  for modules that happen to exist. Stream is empty if no match is discovered.
  **/

  var file = normalize(requirement);
  var paths = map(function(descriptor) {
    return path.join(descriptor.linker.path, descriptor.lib || 'lib', file);
  }, descriptors);
  return existing(paths);
};

search.main = function(requirement, descriptors) {
  /**
  Searches for a requirement as an entry point `module`
  from the given package descriptors and returns stream of matches.
  **/

  // Filter out packages that have a `name` matching a `requirement`.
  var matches = filter(is(field('name'), requirement), descriptors);
  // Map each match to `path` of it's entry point module by looking into `lib`
  // and `main` properties of the descriptor.
  return map(function(descriptor) {
    // Default value for `{package.json}.main` is `./main`.
    var main = normalize(descriptor.main || 'main');
    // Default value for `{package.json}.lib is `lib`.
    var lib = descriptor.lib || 'lib';
    return isLocal(main) ? path.join(descriptor.linker.path, main) :
                           path.join(descriptor.linker.path, lib, main);
  }, matches);
};

search.packaged = function(requirement, descriptors) {
  /**
  Treats `requirement` as `my-package/path/to/module` form and
  returns paths for the `path/to/module` modules in the packages that have
  `my-package` name.
  **/

  var name = extractPackageName(requirement);
  var location = extractModulePath(requirement);

  // Filter out packages that have a matching names.
  var matches = filter(is(field('name'), name), descriptors);
  return search.from(location, matches);
};

search.core = function(requirement, descriptors) {
  /**
  Searches for `requirement` module `paths` only in the core SDK packages
  (addon-kit, api-utils) from the given packages.
  **/
  var name = field('name');
  var isCore = or(is(name, 'addon-kit'), is(name, 'api-utils'));
  var matches = filter(isCore, descriptors);
  return search.from(requirement, matches);
};

search.own = function(requirement, descriptors, root) {
  /**
  Treats given `requirement` as a relative one and looks for matching
  module paths with in the package itself. `root` is path of the
  package from which require was initiated, this the package that will be used.
  **/
  var matches = filter(is(query('linker.path'), root), descriptors);
  return search.from(requirement, matches);
};

search.dependency = function(requirement, packages) {
  /**
  Searches `requirement` in all the given packages in an alphabetical order.
  **/
  var sorted = sort(function(a, b) {
    return !a.name ? 1 :
           !b.name ? -1 :
           a.name > b.name ? 1 : -1;
  }, packages);
  return search.from(requirement, sorted);
};


function mark(type) {
  // Utility function that helps to map module path to nodes containing more
  // metadata.
  return function marker(requirement) {
    // Marker is just an utility to carry `requirement` information since
    // same requirement will be searched in many locations.
    return function(location) {
      return {
        type: 'deprecated',
        requirement: requirement,
        path: location,
        warning: { type: type }
      };
    };
  };
}

// Create markers per each type of search branch in order to include
// information about which search logic was successful. This would allow
// us to generate much better suggestions how users can migrate to a new
// pattern.
mark.packaged = mark('packaged');
mark.main = mark('main');
mark.core = mark('core');
mark.own = mark('own');
mark.dependency = mark('dependency');

