cachifest
=========

This is a command line tool for watching for a directory changes.
Each time a file is updated in this directory, `cachifest` assembles an updated `manifest.json` file which has a map of file renames 

`cachifest` is useful for making efficient http caching with following features:
 1. All static files have far future expiration without revalidation.
 2. If a static file changed it should be invalidated by composing a new unique url for it.
 3. Developers and admins don't need to run any maintenance scripts after rolling new changes to servers.

It can be achieved bu using `cachifest` in this scheme:
 1. you run `cachifest` (consider <a href="http://mmonit.com/monit/">monit</a>, <a href="http://supervisord.org/">supervisord</a>, etc.) to monitor a directory. Usually it should be static files dir in your project and it should be accessible via http.
 2. an http app (site, flash, etc) loads `manifest.json`:

 ```javascript
 {
   'client.swf': 'client_v1354729620000203.swf',
   'assets/bg.swf': 'assets/bg_v1354729620000203.swf',
   ...
 }
 ```
 It's usually better to load `manifest.json?rand=...` with some random payload to avoid `manifest.json` caching for sure.
 3. in order to load a file it makes a lookup for a path, e.g. 'client.swf'.
 4. if the file is mentioned in the `manifest.json` it can be accessed by an alternative name `client_v1354729620000203.swf`.
 5. then your app loads the file by the alternative name.
 6. whatever web server you use it should be configured to rewrite `client_v1354729620000203.swf` back to `client.swf` and send this file.

Installation
============

`npm install [-g] cachifest`

Usage
=====

```bash
$ ./cachifest.js --help
Usage: node ./cachifest.js [--help] [--manifest file] [--dir dir]

Options:
  --help      print out help and exit  [boolean]
  --manifest                           [default: "manifest.json"]
  --dir                                [default: "."]
```