import gulp from 'gulp';
import gulpif from 'gulp-if';
import rename from 'gulp-rename';
import named from 'vinyl-named';
import config from './config/webpack.config';
import gulpWebpack from 'webpack-stream';
import plumber from 'gulp-plumber';
import livereload from 'gulp-livereload';
import args from './lib/args';
import fs from 'fs';

if (!args.production) {
  config.entry.tests = ['./app/background/lib/lodash.js', './app/background/tests/tests.js'];
}

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe(plumber())
    .pipe(named())
    .pipe(gulpWebpack(config))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()));
});
