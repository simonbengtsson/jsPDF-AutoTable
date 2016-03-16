var fs = require('fs');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
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
        entry: './src/main.js',
        plugins: [babel({presets: ["es2015-rollup"]})]
    }).then(function (bundle) {
        var code = bundle.generate({
            format: 'umd',
            banner: '/** \n' +
            ' * jsPDF AutoTable plugin v' + require('./package.json').version + '\n' +
            ' * Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable \n' +
            ' * \n' +
            ' * Licensed under the MIT License. \n' +
            ' * http://opensource.org/licenses/mit-license \n' +
            ' * \n' +
            ' * @preserve \n' +
            ' */'
        }).code;

        if (dist) {
            var minified = uglify.minify(code, {fromString: true, output: {comments: /@preserve|@license/i}}).code;
            fs.writeFileSync('./dist/jspdf.plugin.autotable.js', minified);
            fs.writeFileSync('./dist/jspdf.plugin.autotable.src.js', code);
        }
        fs.writeFileSync( './examples/libs/jspdf.plugin.autotable.src.js', code);
        var write = fs.createWriteStream('./examples/libs/jspdf.min.js');
        fs.createReadStream('./node_modules/jspdf/dist/jspdf.min.js').pipe(write);

        console.log('Done');
    }, function(err) {
        console.error(err);
    });
}