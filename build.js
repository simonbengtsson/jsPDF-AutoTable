var fs = require('fs');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var uglify = require("uglify-js");

switch (process.argv[2]) {
    case 'develop':
        build(false);
        break;
    case 'build':
        build(true);
        break;
    default:
        throw "Invalid type argument";
}

/**
 * Build the src version of jspdf-autotable
 */
function build(dist) {
    rollup.rollup({
        entry: 'src/main.js',
        plugins: [nodeResolve({jsnext: true, main: true, skip: ['jspdf']}), commonjs({}), babel({
            exclude: 'node_modules/**',
            presets: ["es2015-rollup"]
        })]
    }).then(function (bundle) {
        var newVersion = require('./package.json').version;
        var readme = "" + fs.readFileSync('./README.md');
        var newVersionStr = "cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/" + newVersion + "/jspdf.plugin.autotable.js";
        readme = readme.replace(/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf-autotable\/.*\/jspdf\.plugin\.autotable\.js/, newVersionStr);
        fs.writeFileSync('./README.md', readme);
        
        var banner = '/** \n' +
        ' * jsPDF AutoTable plugin v' + newVersion + '\n' +
        ' * Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable \n' +
        ' * \n' +
        ' * Licensed under the MIT License. \n' +
        ' * http://opensource.org/licenses/mit-license \n' +
        ' * \n' +
        ' * @preserve \n' +
        ' */';
        
        var code = bundle.generate({format: 'umd', banner: banner}).code;
        if (dist) {
            var minified = uglify.minify(code, {fromString: true, output: {comments: /@preserve|@license/i}}).code;
            fs.writeFileSync('./dist/jspdf.plugin.autotable.js', minified);
            fs.writeFileSync('./dist/jspdf.plugin.autotable.src.js', code);
        }
        fs.writeFileSync( './examples/libs/jspdf.plugin.autotable.src.js', code);
        fs.writeFileSync('./examples/libs/jspdf.min.js', fs.readFileSync('./node_modules/jspdf/dist/jspdf.min.js'));

        console.log('Build finished successfully');
    }).catch(function(err) {
        console.log('ROLLUP ERROR:');
        console.error(err);
    });
}