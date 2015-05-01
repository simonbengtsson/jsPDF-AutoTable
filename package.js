// Package metadata file for Meteor.js. Maintainer: @chipcastle.
'use strict';

// TODO Fill in atmosphere url
var packageName = 'jspdf:autotable';  // http://atmospherejs.com/
var gitHubPath = 'someatoms/jsPDF-AutoTable';  // https://github.com/someatoms/jsPDF-AutoTable
// TODO This package need to be published on npmjs.org
var npmPackageName = 'jspdf-autotable'; // https://libraries.io/bower/jspdf-autotable
var where = 'client';  // where to install: 'client' or 'server'. For both, pass nothing.

/* All of the below is just to get the version number of the 3rd party library.
 * First we'll try to read it from package.json. This works when publishing or testing the package
 * but not when running an example app that uses a local copy of the package because the current
 * directory will be that of the app, and it won't have package.json. Find the path of a file is hard:
 * http://stackoverflow.com/questions/27435797/how-do-i-obtain-the-path-of-a-file-in-a-meteor-package
 * Therefore, we'll fall back to GitHub, and then to NPMJS.
 * We also don't have the HTTP package at this stage, and if we use Package.* in the request() callback,
 * it will error that it must be run in a Fiber. So we'll use Node futures.
 */
var request = Npm.require('request');
var Future = Npm.require('fibers/future');

var fut = new Future;
var version;

try {
  var packageJson = JSON.parse(Npm.require('fs').readFileSync('jsPDF-AutoTable/package.json'));
  version = packageJson.version;
} catch (e) {
  // if the file was not found, fall back to GitHub
  console.warn('Could not find package.json to read version number from; trying GitHub...');
  var url = 'https://api.github.com/repos/' + gitHubPath + '/tags';
  request.get({
    url: url,
    headers: {
      'User-Agent': 'request'  // GitHub requires it
    }
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var version = JSON.parse(body)[0]['name'];  // e.g. "v4.3.0"
      fut.return(version.replace(/^\D+/, ''));  // trim leading non-digits
    } else {
      // GitHub API rate limit reached? Fall back to npmjs.
      console.warn('GitHub request to', url, 'failed:\n ', response && response.statusCode, response && response.body, error || '', '\nTrying NPMJS...');
      url = 'http://registry.npmjs.org/' + npmPackageName + '/latest';
      request.get(url, function (error, response, body) {
        if (!error && response.statusCode === 200)
          fut.return(JSON.parse(body).version);
        else
          fut.throw('Could not get version information from ' + url + ' either (incorrect package name?):\n' + (response && response.statusCode || '') + (response && response.body || '') + (error || ''));
      });
    }
  });

  version = fut.wait();
}

// Now that we finally have an accurate version number...
Package.describe({
  name: packageName,
  summary: 'PDF table generator in javascript (jspdf plugin)',
  version: version,
  git: 'https://github.com/MeteorPackaging/jsPDF-AutoTable.git',
  documentation: 'README.md'
});


Package.onUse(function (api) {
  api.addFiles([
    'jsPDF-AutoTable/jspdf.plugin.autotable.js'
  ], where);
});
