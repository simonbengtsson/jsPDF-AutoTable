const webpack = require('webpack')
const path = require('path')

const minified = process.argv.includes('--minified')
const newVersion = require('./package.json').version
const currentYear = new Date().getFullYear()

module.exports = {
  entry: {
    [`dist/jspdf.plugin.autotable${minified ? '.min' : ''}`]: './src/main.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.join(__dirname, './'),
    filename: '[name].js',
    libraryTarget: 'umd',
    globalObject: 'typeof this !== \'undefined\' ? this : window',
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
    contentBase: '.',
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
    minimize: minified,
  },
}
