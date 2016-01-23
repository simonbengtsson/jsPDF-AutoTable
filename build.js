var fs = require('fs');
var rollup = require('rollup');
var typescript = require('rollup-plugin-typescript');

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
 * Build the src version of jspdf-autotabl
 */
function build() {
    rollup.rollup({
        entry: './src/main.js',
        plugins: [typescript()]
    }).then(function (bundle) {
        return bundle.write({format: 'iife', dest: './dist/jspdf.plugin.autotable.src.js'});
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