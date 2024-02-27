import webpack from 'webpack'
import path from 'path'
import fs from 'fs'
import TerserPlugin from 'terser-webpack-plugin'
import * as url from 'url'

export default (env) => {
  const minified = !!env.minified
  const __dirname = url.fileURLToPath(new url.URL('.', import.meta.url))
  const outputPath = path.join(__dirname, './')

  return {
    entry: {
      [`dist/jspdf.plugin.autotable${minified ? '.min' : ''}`]: './src/main.ts',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      library: {
        name: 'jspdf-autotable',
        type: 'umd',
      },
      path: outputPath,
      filename: '[name].js',
      globalObject: "typeof self !== 'undefined' ? self : this",
    },
    module: {
      rules: [{ test: /\.ts$/, use: [{ loader: 'ts-loader' }] }],
    },
    performance: { hints: false },
    devServer: {
      static: {
        directory: '.',
        watch: false,
      },
      watchFiles: ['index.html', 'examples/**/*'],
      port: 9000,
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: bannerString(),
        raw: true,
      }),
    ],
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
      minimize: !!minified,
    },
  }
}

export function bannerString() {
  const packageJsonStr = fs.readFileSync('package.json')
  const packageJson = JSON.parse(packageJsonStr)
  const version = packageJson.version
  const currentYear = new Date().getFullYear()

  const banner = `
/**
 *    jsPDF AutoTable plugin v${version}
 *
 *    Copyright (c) ${currentYear} Simon Bengtsson, https://github.com/simonbengtsson/jsPDF-AutoTable
 *    Licensed under the MIT License.
 *    http://opensource.org/licenses/mit-license
 *
 */
  `
  return banner.trim()
}
