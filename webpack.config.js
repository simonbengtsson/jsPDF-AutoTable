const webpack = require('webpack')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const packageJson = require('./package.json')

module.exports = (env) => {
  const minified = !!env.minified
  const newVersion = packageJson.version
  const currentYear = new Date().getFullYear()
  const outputPath = path.join(__dirname, './')

  return {
    entry: {
      [`dist/jspdf.plugin.autotable${minified ? '.min' : ''}`]: './src/main.ts',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      path: outputPath,
      filename: '[name].js',
      libraryTarget: 'umd',
      globalObject: "typeof this !== 'undefined' ? this : window",
    },
    module: {
      rules: [{ test: /\.ts$/, use: [{ loader: 'ts-loader' }] }],
    },
    externals: {
      jspdf: {
        commonjs: 'jspdf',
        commonjs2: 'jspdf',
        amd: 'jspdf',
        root: 'jspdf',
      },
    },
    performance: { hints: false },
    devServer: {
      static: {
        directory: '.',
      },
      port: 9000,
      proxy: {
        '/libs/jspdf.plugin.autotable.js': {
          target: 'http://localhost:9000/dist/',
          pathRewrite: { '^/libs': '' },
        },
      },
    },
    plugins: [
      new webpack.BannerPlugin(`
              jsPDF AutoTable plugin v${newVersion}
              
              Copyright (c) ${currentYear} Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable
              Licensed under the MIT License.
              http://opensource.org/licenses/mit-license
          `),
    ],
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
      minimize: !!minified,
    },
  }
}
