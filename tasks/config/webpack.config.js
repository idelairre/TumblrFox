import args from '../lib/args';
import path from 'path';
import webpack from 'webpack';

module.exports = {
  entry: {
    onload: ['./app/background/lib/chromeExOauth.js', './app/background/lib/chromeExOauthsimple.js', './app/background/lib/onload.js'],
    options: './app/background/options/components/options.js',
    contentscript: './app/contentScripts/contentscript.js',
    background: './app/background/background.js',
    test: 'mocha!./tests/test.js',
    vendor: ['jquery', 'lodash', 'backbone']
  },
  devtool: args.sourcemaps ? 'source-map' : null,
  watch: args.watch,
  output: {
    path: '/',
    filename: '[name].js'
  },
  plugins: [
    new webpack.DefinePlugin({
      '__ENV__': args.test ? JSON.stringify('test') : JSON.stringify(args.production ? 'production' : 'development'),
      '__VENDOR__': JSON.stringify(args.vendor)
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js', Infinity)
  ].concat(args.production ? [new webpack.optimize.UglifyJsPlugin({ mangle: false }), new webpack.optimize.DedupePlugin()] : []),
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
      loader: 'url-loader?limit=10000&minetype=application/font-woff'
    }, {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
            'file?hash=sha512&digest=hex&name=[hash].[ext]',
            'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
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
