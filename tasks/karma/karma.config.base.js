'use strict';

var path = require('path');
var config = require('../config/webpack.config');

module.exports = {
  basePath: '../..',
  autoWatch: false,
  singleRun: true,
  colors: true,
  frameworks: ['jasmine'],
  browsers: ['Chrome'],
  files: ['app/background/tests/tests.js'],
  preprocessors: {
    'app/background/tests/tests.js': ['webpack']
  },
  webpack: {
    module: {
      noParse: /node_modules\/json-schema\/lib\/validate\.js/,
      preLoaders: [{
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }],
      loaders: [{
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
      }, {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }, {
        test: /\.html$/,
        loader: 'html'
      }, {
        test: /\.js$/,
        loader: 'babel?cacheDirectory',
        exclude: /node_modules/
      }, {
        test: /\.json$/,
        loader: 'json'
      }, {
        test: /\.(ttf|eot|svg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file'
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      }, {
        test: /\.(jpe?g|gif|svg)$/i,
        loaders: 'url-loader?limit=10000&mimetype=application/font-woff'
      }]
    },
    modulesDirectories: ['node_modules'],
    resolve: {
      root: path.resolve(__dirname),
      extensions: ['', '.webpack.js', '.web.js', '.js']
    },
    resolveLoader: {
      root: path.resolve('node_modules')
    },
    node: {
      net: 'empty',
      tls: 'empty',
      fs: 'empty'
    },
  },
  webpackMiddleware: {
    stats: {
      chunks: false,
      errors: false,
      colors: true,
      modules: false,
      noInfo: true,
      warnings: false
    }
  }
}
