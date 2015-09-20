var fs = require('fs');
var spawn = require('child_process').spawn;

switch(process.argv[2]) {
    case 'release':
        release();
        break;
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
    var pf = fs.readFileSync('package.json', 'utf8');
    var v = JSON.parse(pf).version;

    var distFiles = ['dist/jspdf.plugin.autotable.js', 'dist/jspdf.plugin.autotable.src.js'];
    for (var file of distFiles) {
        var lf = fs.readFileSync(file, 'utf8');
        lf = lf.replace('__VERSION__', 'v' + v);
        fs.writeFile(file, lf);
    }
}

/**
 * Updates the package.json version
 */
function release() {
    var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion(packageJson, process.argv[3]);
    fs.writeFile('package.json', JSON.stringify(packageJson, null, '  '));

    function newVersion(json, argVersion) {
        if (argVersion) {
            if (argVersion.split('.').length !== 3) {
                throw 'Invalid version argument';
            }
            return argVersion;
        } else {
            var versions = json.version.split('.');
            versions[2] = parseInt(versions[2]) + 1;
            return versions.join('.');
        }
    }
}