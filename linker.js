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

function join(a, b) {
  var descriptor = {};
  var names = Object.getOwnPropertyNames(a).concat(Object.getOwnPropertyNames(b));
  names.forEach(function(name) {
    descriptor[name] = Object.getOwnPropertyDescriptor(b, name) ||
      Object.getOwnPropertyDescriptor(a, name);
  });
  return Object.create(Object.prototype, descriptor);
}

function isLocal(requirement) { return requirement[0] === '.'; }

function relativify(path) {
  return path[0] !== '.' ? './' + path : path;
}

function idify(path) {
  return path.substr(-3) === '.js' ? path.substr(0, path.length - 3) : path;
}

function normalize(path) {
  return relativify(path.substr(-3) === '.js' ? path : path + '.js');
}

function pathFor(module) {
  return module.type === 'std' ? path.join(env.JETPACK_PATH, module.path) :
    module.type === 'local' ? path.join(module.root, module.path) :
    module.type === 'external' ? path.join(module.root, module.path) :
    module.type === 'deprecated' ? path.join(env.JETPACK_PATH, module.path) :
    null;
}

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

function tree(isBranch, getNodes, root) {
  /**
  Utility function that takes `isBranch`, `getNodes`, functions and
  `root` node data structure and returns object that can be walked
  as a tree via `reduce` method.
  **/

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


function extract(requirer) {
  /**
  Returns stream of requirement records for the given `requirer` in
  the given `path`.
  **/

  var path = pathFor(requirer);
  var names = extract.read(path);
  var requirements = streamer.map(function(name) {
    return {
      root: requirer.root,
      requirement: name,
      requirer: requirer
    };
  }, names);

  return path ? requirements : Stream.empty;
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

extract.read = function read(path) {
  /**
  Function takes module file path and returns stream of it's
  requirements in form of strings.
  **/

  // Read file from the given path.
  var source = fs.read(path);
  // Map file source to a stream of array of dependency names.
  var names = streamer.map(extract.parse, source);
  // Map arrays to streams and flatten container stream.
  return streamer.flatten(streamer.map(Stream.from, names));
};

function analyze(requirements) {
  /**
  Function takes module requirements stream and returns stream of same
  requirements but with require type annotations.
  **/
  return streamer.map(analyze.annotate, requirements);
}
exports.analyze = analyze;
analyze.annotate = function annotate(node) {
  /**
  Function takes module requirement and adds a type annotation to it,
  which is either 'system', 'local' or 'external'.
  */
  return join(node, { type: isLocal(node.requirement) ? 'local' : 'unknown' });
};

function locate(requirements, requirer) {
  var local = streamer.filter(function(requirement) {
    return requirement.type === 'local';
  }, requirements);

  var unknown = streamer.filter(function(requirement) {
    return requirement.type === 'unknown';
  }, requirements);

  return streamer.mix(
    streamer.flatten(streamer.map(locate.local, local)),
    streamer.flatten(streamer.map(locate.unknown, unknown))
  );
}

function identify(requirements) {
  return streamer.map(function(requirement) {
    var type = requirement.type;
    var name = requirement.requirement;
    var requirer = requirement.requirer;
    var root = requirement.root;
    var id = type === 'std' ? name :
             type === 'system' ? name :
             type === 'local' ? relativify(path.join(path.dirname(requirer.id), name)) :
             type === 'external' ? idify(requirement.path) :
             null;

    return join(requirement, { id: id });
  }, requirements);
}
exports.identify = identify;

exports.locate = locate;

locate.local = function local(requirement) {
  /**
  Takes `local` type requirement and locates it on the file system, returning
  a stream of single `requirement` containing `path` property for the given
  requirement.
  **/
  var requirer = requirement.requirer;
  var type = requirer.type;
  // Resolve base directory of the requirer.
  var base = path.dirname(pathFor(requirer));
  // Resolve file path where requirement must be located.
  var file = path.join(base, normalize(requirement.requirement));
  // Get a stream of verified file paths, in this case it's either stream
  // of single item `file` or empty. Later would mean that file was not found.
  var paths = existing(Stream.of(file));
  // We refine `requirement` with a `path` information.
  var refined = streamer.map(function(value) {
    value = type === 'std' ? path.relative(env.JETPACK_PATH, value) :
      type === 'deprecated' ? path.relative(env.JETPACK_PATH, value) :
      type === 'external' ? path.relative(requirement.root, value) :
      type === 'local' ? path.relative(requirement.root, value) :
      type === 'system' ? null : value;

    return join(requirement, {
      type: requirer.type,
      path: value && relativify(value)
    });
  }, paths);
  // We append broken requirement node to the end of the refined
  // stream, this way if it's empty broken node will be the first in
  // the result. Otherwise it will be ignored as we only care about
  // a first match.
  var result = streamer.append(refined, Stream.of(join(requirement, {
    path: file,
    error: 'Module: ' + requirement.requirement +
      ' required by module: ' + requirer.id +
      ' could not be located at: ' + file
  })));

  return streamer.take(1, result);
};

locate.unknown = function(requirement) {
  var external = locate.external(requirement);
  var std = locate.std(requirement);
  var deprecated = locate.deprecated(requirement);

  // Append stream of **external** module with **system** one followed
  // by a **deprecated** search. This way first match will be external
  // if there is none then system if still none then will fallback
  // to legacy lookup.
  var prioritized = streamer.append.all(external, std, deprecated);

  // Append entry for **system**
  var result = streamer.append(prioritized, Stream.of(join(requirement, {
    type: 'system'
  })));

  return streamer.take(1, result);
};

locate.external = function external(requirement) {
  var paths = locate.external.find(requirement);

  var result = streamer.map(function(entry) {
    return join(requirement, {
      type: 'external',
      path: relativify(path.relative(requirement.root, entry))
    });
  }, paths);

  return result;
};
locate.external.lookups = function lookups(from) {
  var name = env.JETPACK_MODUELS_DIR || '@modules';
  return tree(function isBranch(node) {
    // Is branch if it has `/`
    return !!~node.indexOf('/');
  }, function nodes(branch) {
    // branch path has only node which is parent path:
    // path/to/my/module -> [ path/to/my ]
    return [ branch.substr(0, branch.lastIndexOf('/')) ];
  }, from).reduce(function(paths, node) {
    paths.push(path.join(node, name));
    return paths;
  }, []);
};
locate.external.find = function(requirement) {
  var root = requirement.root;
  var requirer = pathFor(requirement.requirer);
  var base = path.dirname(requirer);
  var file = normalize(requirement.requirement);
  // create array of lookups directories.
  var directories = locate.external.lookups(base);

  // Generate paths where requirement module may be found.
  var paths = directories.map(function(directory) {
    return path.join(directory, file);
  }).
  // Make sure that module requirement does not requires itself.
  // For example module from 'my-addon/@modules/tabs.js' may require
  // 'tabs' module, that should be `tabs` system module rather than
  // 'my-addon/@modules/tabs.js' itself.
  filter(function(path) {
    return path !== requirer;
  });
  // Create a lazy stream of existing paths. Stream elements are ordered
  // by a best match, there for first item in stream is a best match. If
  // stream is empty module is not found.
  return existing(Stream.from(paths));
};

locate.std = function(requirement) {
  var paths = existing(Stream.from(locate.std.lookups(requirement)));
  var result = streamer.map(function(value) {
    return join(requirement, {
      type: 'std',
      path: relativify(path.relative(env.JETPACK_PATH, value))
    });
  }, paths);

  return streamer.take(1, result);
};
locate.std.lookups = function(requirement) {
  // Standard library modules are in JETPACK_PATH/lib/
  return [ path.join(env.JETPACK_PATH, './lib/', normalize(requirement.requirement)) ];
};

locate.deprecated = function locate(node) {
  // So far just return empty
  return Stream.of();
};
locate.deprecated.lookups = function(from) {
  return [
    './packages/addon-kit/lib/',
    './packages/api-utils/lib/'
  ].map(function(directory) {
    return path.join(from, directory);
  });
};
locate.deprecated.find = function(requirement, requirer, root) {
  // create array of lookups directories.
  var directories = locate.deprecated.lookups(env.JETPACK_PATH);
  var paths = streamer.map(function(directory) {
    return path.join(directory, requirement);
  }, Stream.from(directories));
  return existing(paths);
};

function link(requirement, path) {
  path = path || process.cwd();
  return cleanup(graph({
    root: path,
    type: 'local',
    id: requirement,
    path: normalize(requirement),
    requirement: requirement
  }, []));
}
exports.link = link;

function manifest(requirement, path) {
  return streamer.reduce(function(result, node) {
    result[node.id] = node;
    return result;
  }, link(requirement, path), {});
}
exports.manifest = manifest;

function cleanup(graph) {
  return streamer.map(function(node) {
    return {
      path: node.path,
      id: node.id,
      type: node.type,
      requirements: node.requirements
    };
  }, graph);
}
exports.cleanup = cleanup;

function graph(root, visited) {
  /**
  Returns stream of all dependent nodes
  **/

  visited.push({ type: root.type, id: root.id });

  var node = join(root, { requirements: {} });
  var requirements = extract(node);
  var anotated = analyze(requirements);
  var located = locate(anotated);
  var identified = identify(located);
  var requirer = streamer.reduce(function(node, dependency) {
    var requirement = {};
    requirement[dependency.requirement] = dependency.id;
    return join(node, { requirements: join(node.requirements, requirement) });
  }, identified, node);

  return streamer.append(requirer, dependencies(identified, visited));
}
exports.graph = graph;

function dependencies(requirements, visited) {
  // filter out not yet known requirements.
  var unknown = streamer.filter(function(requirement) {
    return !visited.some(function(node) {
      return node.type === requirement.type && node.id === requirement.id;
    });
  }, requirements);
  return streamer.flatten(streamer.map(function(requirement) {
    return graph(requirement, visited);
  }, unknown));
}

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
