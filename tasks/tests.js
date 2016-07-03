import appRoot from 'app-root-path';
import gulp from 'gulp';
import named from 'vinyl-named';
import webpack from 'webpack';
import config from './config/webpack.config';
import gulpWebpack from 'webpack-stream';
import WebpackDevServer from 'webpack-dev-server';
import plumber from 'gulp-plumber';
import args from './lib/args';
import fs from 'fs';
import { escape } from 'lodash';

if (args.test) {
  const path = appRoot.resolve('tests/test.js');

  const bundler = new WebpackDevServer(webpack(config), {
    entry: 'mocha!./tests/test',
    publicPath: './tests',
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

  gulp.task('tests', ['livereload', 'scripts'], () => {
    return gulp.src('tests/test/**/*.js')
      .pipe(plumber())
      .pipe(named())
      .pipe(gulp.dest('tests'))
      .pipe(gulpif(args.watch, livereload()));
  });
}
