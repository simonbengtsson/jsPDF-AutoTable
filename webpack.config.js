const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require("webpack");
const fs = require("fs");
const path = require('path');

const newVersion = require('./package.json').version;
const newVersionStr = "cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/" + newVersion + "/jspdf.plugin.autotable.js";
let readme = "" + fs.readFileSync('./README.md');
readme = readme.replace(/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf-autotable\/.*\/jspdf\.plugin\.autotable\.js/, newVersionStr);
fs.writeFileSync('./README.md', readme);

module.exports = {
    entry: {
        "dist/jspdf.plugin.autotable": "./src/main.ts",
        "dist/jspdf.plugin.autotable.min": "./src/main.ts",
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        path: path.join(__dirname, './'),
        filename: "[name].js",
        libraryTarget: "umd",
    },
    module: {
        rules: [
            { test: /\.ts$/, use: [{
                loader: 'ts-loader'
            }] }
        ]
    },
    externals: {
        "jspdf": {
            commonjs: "jspdf",
            commonjs2: "jspdf",
            amd: "jspdf",
            root: "jsPDF"
        }
    },
    performance: { hints: false },
    devServer: {
        contentBase: "./examples",
        port: 9000,
        proxy: {
            "/libs/jspdf.plugin.autotable.js": {
                target: "http://localhost:9000/dist/",
                pathRewrite: {"^/libs" : ""}
            }
        }
    },
    plugins: [new webpack.BannerPlugin(""
        + "jsPDF AutoTable plugin v" + newVersion + "\n"
        + "Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable \n"
        + "\n"
        + "Licensed under the MIT License.\n"
        + "http://opensource.org/licenses/mit-license\n"
        + "\n"
        + "*/if (typeof window === 'object') window.jspdfAutoTableVersion = '" + newVersion + "';/*"
        + "")],

    optimization: {
        minimize: true,

        minimizer: [new UglifyJsPlugin({
            include: /\.min\.js$/
        })]
    }
};