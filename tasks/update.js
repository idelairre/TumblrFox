import crx from 'gulp-crx-pack';
import fs from 'fs';
import gulp from 'gulp';
let manifest = require('../app/manifest.json');

gulp.task('crx', () => {
  return gulp.src('.')
    .pipe(crx({
      privateKey: fs.readFileSync('./key.pem', 'utf8'),
      filename: './app/' + manifest.name + '.crx',
      codebase: manifest.update_url,
      updateXmlFilename: 'update.xml'
    }))
    .pipe(gulp.dest('./dist'));
});
