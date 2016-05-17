import appRoot from 'app-root-path';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import named from 'vinyl-named';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';
import WebpackDevServer from 'webpack-dev-server';
import plumber from 'gulp-plumber';
import args from './lib/args';

let path = appRoot.resolve('test/index.js');

console.log(args.watch);

let config = {
  entry: 'mocha!./test/index.js',
  output: {
    path: '/test',
    publicPath: 'http://localhost:8000/test',
    filename: 'test.build.js',
    chunkFilename: '[name].[id].js'
  },
  devtool: args.sourcemaps ? 'eval' : null,
  target: 'web',
  watch: args.watch,
  plugins: [
    new webpack.DefinePlugin({
      '__ENV__': JSON.stringify('test'),
      '__VENDOR__': JSON.stringify(args.vendor)
    }),
  ],
  module: {
    noParse: /node_modules\/json-schema\/lib\/validate\.js/,
    loaders: [
      { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' },
      { test: /\.html$/, loader: 'html' },
      { test: /\.js$/, loader: 'babel?cacheDirectory', exclude: /node_modules/ },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  modulesDirectories: ['node_modules'],
  resolve: {
    root: appRoot.path,
    extensions: ['', '.webpack.js', '.web.js', '.js']
  },
  resolveLoader: {
    root: appRoot.resolve('node_modules')
  }
};

if (args.watch) {

  let bundleStart = null;
  let compiler = webpack(config);

  compiler.plugin('compile', () => {
    console.log('Bundling...');
    bundleStart = Date.now();
  });

  compiler.plugin('done', () => {
    console.log(`Bundled in ${Date.now() - bundleStart} ms.`);
  });

  let bundler = new WebpackDevServer(compiler, {
    entry: 'mocha!./test/index',
    publicPath: appRoot.resolve('./test'),
    hot: true,
    quiet: false,
    noInfo: true,
    stats: {
      colors: true
    }
  });

  bundler.listen(8000, 'localhost', () => {
    console.log('listening on port 8000');
  });
}

gulp.task('tests', (cb) => {
  return gulp.src(path)
    .pipe(plumber())
    .pipe(named())
    .pipe(gulpWebpack(config))
    .pipe(gulp.dest('test/dist'));
});
