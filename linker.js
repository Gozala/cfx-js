/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint node: true globalstrict: true */

'use strict';

var streamer = require('streamer/core'), Stream = streamer.Stream;
var fs = require('fs-streamer/fs');
var path = require('path');
var env = require('environment').env;

// Utility function that takes field `name` and returns function
// that returns value of the given `target` argument's field with
// this `name`.
function field(name) {
  return function getField(target) {
    return target[name];
  };
}

function extract(requirer, path) {
  /**
  Returns stream of requirement records for the given `requirer` in
  the given `path`.
  **/
  var requirements = streamer.zip.all(
    extract.read(requirer, path),
    streamer.repeat(requirer),
    streamer.repeat(path));

  return streamer.map(extract.record, requirements);
}
exports.extract = extract;

extract.parse = new function() {
  var COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g;
  var REQUIRE_PATTERN = /require\s*\(['"]([\w\W]*?)['"]\s*\)/g;

  return function parse(source) {
    /**
    Takes file source and extracts all requirement names that are
    found. Returns array of requirement terms
    **/
    var match, result, input;
    input = String(source).replace(COMMENT_PATTERN, '');
    result = [];
    while ((match = REQUIRE_PATTERN.exec(input)))
      result.push(match[1]);
    return result;
  };
};

extract.read = function read(requirer, root) {
  /**
  Function takes module file path and returns stream of it's
  requirements in form of strings.
  **/

  // Read file from the given path.
  var source = fs.read(path.resolve(root || '.', requirer));
  // Map file source to a stream of array of dependency names.
  var names = streamer.map(extract.parse, source);
  // Map arrays to streams and flatten container stream.
  return streamer.flatten(streamer.map(Stream.from, names));
};

extract.record = function record(tuple) {
  /**
   * Creates a record with 'root', 'requirer' and 'requirement' representing
   * a requirement record.
   */
  return {
    root: tuple.pop(),
    requirer: tuple.pop(),
    requirement: tuple.pop()
  };
};

function analyze(requirer, path) {
  /**
  Function takes module requirements stream and returns stream of same
  requirements but with require type annotations.
  **/
  return streamer.map(analyze.annotate, extract(requirer, path));
}
exports.analyze = analyze;

analyze.annotate = function annotate(node) {
  /**
  Function takes module requirement and adds a type annotation to it,
  which is either 'system', 'local' or 'external'.
  */
  var requirement = node.requirement[0];
  var type = requirement[0] === '.' ? 'local' : 'unknown';
  node.type = type;
  return node;
};

function locate(requirements) {
  var local = streamer.filter(function(requirement) {
    return requirement.type === 'local';
  }, requirements);
  var unknown = streamer.filter(function(requirement) {
    return requirement.type === 'unknown';
  }, requirements);

  return streamer.mix.all(
    streamer.flatten(streamer.map(locate.local, local)),
    system, 
    streamer.flatten(streamer.map(locate.external, external)));
}
exports.locate = locate;

function exists(path) {
  /**
  Utility function to test weather file under given path exists
  or not. Returns stream with one item which is either `true` or
  `false`
  **/
  var stat = fs.stat(path);
  var located = streamer.map(function() { return true; }, stat);
  return streamer.capture(function() { return Stream.of(false); }, located);
}

locate.node = function locate(path, node) {
  // If stream contained error, than we failed to stat it.
  // In that case we mark node as not found, otherwise we mark it
  // as found.
  return streamer.map(function(exists) {
    node.located = exists;
    return node;
  }, exists(path));
};

locate.local = function local(node) {
  var base = path.dirname(node.requirer);
  node.path = local.normalize(path.join(base, node.requirement));
  return locate.node(path.join(node.root, node.path), node);
};
locate.local.normalize = function(path) {
  path = path[0] !== '.' ? './' + path : path;
  path = path.substr(-3) === '.js' ? path : path + '.js';
  return path;
};

locate.external = function external(node) {
  node.path = locate.local.normalize(node.requirement);
  var locations = locate.external.find(node.path, node.requirer, node.root);
};

locate.system = function locate(node) {
  return locate.system.find(node.path, node.requirer, node.root);
};
locate.system.lookups = function(from) {
  return [
    './lib/',
    './packages/addon-kit/lib/',
    './packages/api-utils/lib/'
  ].map(function(directory) {
    return path.join(from, directory);
  });
};
locate.system.find = function(requirement, requirer, root) {
   // create array of lookups directories.
  var directories = locate.system.lookups(env.JETPACK_PATH);
  var paths = streamer.map(function(directory) {
    return path.join(directory, requirement);
  }, Stream.from(directories));
  return existing(paths);
};
locate.relative = function(node) {
  return locate.relative.find(node.path, node.requirer, node.root);
};
locate.relative.find = function(requirement, requirer, root) {
  var paths = [
    path.join(path.dirname(path.join(root, requirer)), requirement)
  ];
  return existing(Stream.from(paths));
};

// Utility function that takes `isBranch`, `getNodes`, functions and
// `root` node data structure and returns object that can be walked
// as a tree via `reduce` method.
function tree(isBranch, getNodes, root) {
  return {
    reduce: function(f, start) {
      var result = f(start, root);
      result = isBranch(root) ? getNodes(root).reduce(function(result, node) {
        return tree(isBranch, getNodes, node).reduce(f, result);
      }, result) : result;
      return result;
    }
  };
}

locate.external = function(node) {
  return locate.external.find(node.path, node.requirer, node.root);
};
locate.external.lookups = function lookups(from) {
  return tree(function isBranch(node) {
    // Is branch if it has `/`
    return !!~node.indexOf('/');
  }, function nodes(branch) {
    // branch path has only node which is parent path:
    // path/to/my/module -> [ path/to/my ]
    return [ branch.substr(0, branch.lastIndexOf('/')) ];
  }, from).reduce(function(paths, node) {
    paths.push(path.join(node, '@modules'));
    return paths;
  }, []);
};
locate.external.find = function(requirement, requirer, root) {
  // create array of lookups directories.
  var directories = locate.external.lookups(path.dirname(requirer));
  var paths = streamer.map(function(directory) {
    return path.join(root, directory, requirement);
  }, Stream.from(directories));
  return existing(paths);
};


function existing(paths) {
  /**
  Reduces given stream of `paths` to an existing subset. Returned stream is
  lazy, meaning that IO operations are performed at consumption, so that if
  you stop on first match only operations for up to first match will be
  performed.
  **/

  // create lazy stream of booleans, expressing weather path exists or not.
  var existances = streamer.flatten(streamer.map(exists, paths));
  // create lazy stream of [ path, exists ] pairs.
  var entries = streamer.zip(existances, paths);
  // filter [ path, exists ] pairs only to ones which exists (exists is true).
  var located = streamer.filter(field(0), entries);
  // map pairs back to paths.
  return streamer.map(field(1), located);
}
exports.existing = existing;


/*
- Linker may run in backwards **compatible** or **incompatible** modes. Behavior
  depends on mode it runs in.
- Linker recognizes two forms of require, **relative** (if starts with `.`)
  and **absolute** (does not starts with `.`).

      // Relative
      require('./foo')
      require('../foo/bar')

      // absolute
      require('foo')
      require('foo/bar')

- Linker resolves relative requirements relative to requirer module regardless
  of mode it runs in:

        // From: JETPACK_PATH/packages/reliant/lib/foo.js
        require('./bar')        // => JETPACK_PATH/packages/reliant/lib/bar.js

        // From: JETPACK_PATH/packages/reliant/lib/foo.js
        require('./utils/baz')    // => JETPACK_PATH/packages/reliant/lib/utils/baz.js

        // From: JETPACK_PATH/packages/reliant/lib/utils/baz.js
        require('../beep')       // => JETPACK_PATH/packages/reliant/lib/beep.js

        // From: JETPACK_PATH/packages/reliant/lib/utils/baz.js
        require('../misc/qux')  // => JETPACK_PATH/packages/reliant/lib/misc/qux.js

   If the module cannot be found, an error is raised.

- If SDK runs in backwards **compatible** way lookup package paths is build
  up. If add-on package name is `addon` and it declares it's dependencies in
  `package.json` via `dependencies` property which are `foo, bar`, then search
  paths are:

      [ JETPACK_PATH/packages/addon/, JETPACK_PATH/packages/foo/, JETPACK_PATH/package/bar/ ]

  If dependencies are not listed than search paths are all entries of
  `JETPACK_PATH/packages/` sorted in alphabetical order and prefixed by `JETPACK_PATH/`

- Absolute requirement may fall into two categories: **external** dependencies
  like third party modules or **system** dependencies that are part of jetpack
  or are shipped with a target run-time.

- At first absolute requirement is assumed to be **external** and is being
  looked up in `@modules` sub-directory of the requirer's parent directory.
  If such module is not located lookup will happens in the `@modules`
  sub-directory of parent's parent director. If not located look up will
  continue to the parent directory until add-on root is reached.

- If absolute module is not discovered as **external** dependency it is assumed
  to be a **system** dependency. In which case module lookup will depend on
  the mode.

- In backwards **incompatible** mode lookup will happen under
  `JETPACK_PATH/lib/` and if module is not located it will be assumed to be
  shipped with a target runtime.

- In backwards **compatible** mode lookup will happen under `JETPACK_PATH/lib`
  and if it's not located there deprecated search logic will be performed:

- If the requirement is a multi-term (contains a slash `/`) such as
  `require('package/module/path')`, the loader interprets first term `package`
  as a package name. If there is such a package, it interprets the rest of the
  name `modue/path` as a module path relative to the top of that package.
  The `lib` key of `package.json` for that package is used to determine package
  root, which defaults to `./lib`. This will look for
  `JETPACK_PATH/packages/package/lib/module/path.js`. If such module is
  discovered deprecated module node is created in manifest.

- If the first term does not matches a known package name, processing
  continues with the package search described below.

- If the require term does not contain a slash `/`, the loader attempts to
  interpret it as a package name (intending to use that package's 'entry
  point'). If there is a package with such name, the `main` property is
  consulted, interpreted as a filename relative to the `package.json` file,
  and the resulting module is loaded. If there is no package by that name,
  processing continues with the package-search below.

- The require term (either a single term, or multi-term) is used as the subject
  of a package-search. Each package in the search list is checked to see if the
  named module is present, and the first matching module is used. For example,
  from `JETPACK_PATH/packages/addon/lib/sub/foo.js` where
  `packages/addon/package.json` has a `dependencies` of `B, C` the search-path
  will contain `A, B, C`. If module does `require('bar/baz')` linker will do
  the following lookup:

      packages/addon/lib/bar/baz.js
      packages/B/lib/bar/baz.js
      packages/C/lib/bar/baz.js

- If no module is found by those steps module will be assumed to be shipped
  with a target runtime.
**/
