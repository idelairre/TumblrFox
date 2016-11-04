var args = require('../lib/args');
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    onload: ['./app/background/lib/chromeExOauth.js', './app/background/lib/chromeExOauthsimple.js', './app/background/lib/onload.js'],
    options: ['./app/background/lib/backbone.js', './app/background/components/options.js'],
    contentscript: './app/contentScripts/contentscript.js',
    'fox-bootstrap': './app/contentScripts/bootstrap.js',
    background: ['./app/background/lib/lodash.js', './app/background/background.js'],
    vendor: ['jquery', 'babel-polyfill'],
  },
  devtool: args.sourcemaps ? 'source-map' : null,
  watch: args.watch,
  output: {
    path: '/',
    filename: '[name].js',
    jsonpFunction: 'foxJsonp'
  },
  externals: {
    "backbone": "Backbone",
    "lodash": "window._"
  },
  plugins: [
    new webpack.DefinePlugin({
      '__ENV__': args.test ? JSON.stringify('test') : JSON.stringify(args.production ? 'production' : 'development'),
      '__VENDOR__': JSON.stringify(args.vendor)
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js', Infinity),
  ].concat(args.production ? [new webpack.optimize.UglifyJsPlugin(), new webpack.optimize.DedupePlugin(), new webpack.optimize.AggressiveMergingPlugin()] : []),
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
  eslint: {
    configFile: '.eslintrc'
  }
}
