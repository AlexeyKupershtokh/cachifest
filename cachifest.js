#!/usr/bin/env node

var chokidar = require('chokidar');
var fs = require('fs');
var path_mod = require('path');
var optimist = require('optimist');

var opts = optimist
  .usage('Usage: $0 [--help] [--manifest file] [--dir dir]')
  .default('manifest', 'manifest.json')
  .default('dir', '.')
  .boolean('help')
  .describe('help', 'print out help and exit');

var argv = opts.argv;
if (argv.help) {
  opts.showHelp();
  process.exit();
}

var state = Object.create(null);
var changes = Object.create(null);
var timeout = null;

var dir = path_mod.resolve(argv.dir + '/');
console.log(dir);
var manifest_absolute = path_mod.resolve(argv.manifest);

var watcher = chokidar.watch(dir, {ignored: /\/\./, persistent: true});
watcher
  .on('add', function(path) {
    if (path == manifest_absolute) return;
    changes[path] = true;
    console.log('File', path, 'has been added');
    scheduleUpdate();
  })
  .on('change', function(path) {
    if (path == manifest_absolute) return;
    changes[path] = true;
    console.log('File', path, 'has been changed');
    scheduleUpdate();
  })
  .on('unlink', function(path) {
    if (path == manifest_absolute) return;
    changes[path] = false;
    console.log('File', path, 'has been removed');
    scheduleUpdate();
  })
  .on('error', function(error) {console.error('Error happened', error);})

function scheduleUpdate() {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(update, 1000);
};

function update() {
  for (var path in changes) {
    if (!changes[path]) {
      // removed
      delete changes[path];
      var relative_path = path_mod.relative(dir, path);
      delete state[relative_path];
    }
  }

  for (var path in changes) {
    // added / changed
    fs.stat(path, function(err, stats) {
      process.nextTick(update);
      if (err) return;
      var relative_path = path_mod.relative(dir, path);
      state[relative_path] = convert(relative_path, stats);
    });
    delete changes[path];
    return;
  }

  // empty queue
  update_manifest_file();
};

function update_manifest_file() {
  var str = JSON.stringify(state, null, 2);
  fs.writeFile(manifest_absolute, str, function(err) {
    if (err) {
      console.error(err.stack);
      return;
    }
    console.log('manifest updated:');
    console.log(state);
  });
};

function convert(path, stats) {
  var ext = path_mod.extname(path);
  var dirname = path_mod.dirname(path);
  if (dirname == '.') {
    dirname = '';
  } else {
    dirname += '/';
  }
  var basename = path_mod.basename(path, ext);
  return dirname + basename + '_v' + (+stats.mtime) + stats.size + ext;
};