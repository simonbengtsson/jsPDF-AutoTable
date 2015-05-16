var
  fs = require('fs'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  git = require('gulp-git'),
  del = require('del'),
  replace = require('gulp-replace'),
  runSequence = require('run-sequence'),
  autopublish = require('./autopublish.json')
;

// Clone the upstream repo
// optional parameter: --tag <tag_name>
gulp.task('getUpstream', function(){
  return del(['upstream'], function(err){
    if (err) throw err;
    console.log("cloning " + autopublish.upstream.git);
    git.clone(autopublish.upstream.git, {args: ' --recursive upstream'}, function (err) {
      if (err) throw err;
      var
        release = autopublish.release,
        tag = gutil.env.tag || release,
        path = __dirname + '/upstream/'
      ;
      console.log('checking out ' + tag);
      return git.checkout(tag, {cwd: path}, function (err) {
        if (err) throw err;
        git.status({cwd: path}, function (err) {
          if (err) throw err;
        });
      });
    });
  });
});

// Picks up current version of upstream repo and updates
// 'package.js' and 'autopublish.json' accordingly
gulp.task('updateVersion', function() {
  var
    versionFile = autopublish.upstream.versionFile,
    path = './upstream/' + versionFile
  ;

  return fs.readFile(path, 'utf8', function (err, content) {
    if (err) throw err;

    var
      versionRegexp = /(version?\"?\s?=?\:?\s[\'\"])([\d\.]*)([\'\"])/gi,
      match = versionRegexp.exec(content)
    ;
    if (match.length === 4) {
      var version = match[2];
      console.log('Verision: ' + version);
      gulp.src(['package.js', 'autopublish.json'])
        .pipe(replace(versionRegexp, '$1' + version + '$3'))
        .pipe(gulp.dest('./'));
    }
    else {
      throw 'Unable to extract current version!';
    }
  });
});

// Stores latest published release into 'autopublish.json'
gulp.task('updateRelease', function() {
  var tag = gutil.env.tag;
  if (!tag) throw 'no tag parameter provided!';
  console.log('Release: ' + tag);

  var versionRegexp = /(release?\"?\s?=?\:?\s[\'\"])(.*)([\'\"])/gi;
  return gulp.src(['autopublish.json'])
        .pipe(replace(versionRegexp, '$1' + tag + '$3'))
        .pipe(gulp.dest('./'));
});
