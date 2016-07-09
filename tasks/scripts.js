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

if (!args.test) {
  delete config.entry.test;
} else {
  config.entry.vendor.concat(['chia', 'sinon', 'sinon-chai']);
}

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe(plumber())
    .pipe(named())
    .pipe(gulpWebpack(config))
    .pipe(args.test ? gulp.dest('tests/dist') : gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()));
});
