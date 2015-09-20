var fs = require('fs');

switch(process.argv[2]) {
    case 'updateVersion':
        updateVersion();
        break;
    default:
        throw "Invalid type argument";
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