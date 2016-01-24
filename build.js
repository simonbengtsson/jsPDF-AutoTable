var fs = require('fs');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

switch (process.argv[2]) {
    case 'updateVersion':
        updateVersion();
        break;
    case 'build':
        build();
        break;
    default:
        throw "Invalid type argument";
}

/**
 * Build the src version of jspdf-autotable
 */
function build() {
    rollup.rollup({
        entry: './src/main.js',
        plugins: [babel()]
    }).then(function (bundle) {
        return bundle.write({format: 'iife', dest: './examples/libs/jspdf.plugin.autotable.src.js'});
    }).then(function(msg) {
        console.log('Done');
    }, function(err) {
        console.error(err);
    });
}

/**
 * Updates the plugin version in the dist files
 */
function updateVersion() {
    var v = require('./package.json').version;
    var distFiles = ['dist/jspdf.plugin.autotable.js', 'dist/jspdf.plugin.autotable.src.js'];
    for (var file of distFiles) {
        var lf = fs.readFileSync(file, 'utf8');
        lf = lf.replace('__VERSION__', 'v' + v);
        fs.writeFileSync(file, lf);
    }
}