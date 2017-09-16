var gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  concat = require('gulp-concat'),
  csso = require('gulp-csso'),
  del = require('del'),
  imagemin = require('gulp-imagemin'),
  notify = require('gulp-notify'),
  rename = require("gulp-rename"),
  ts = require('gulp-typescript'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  uncss = require('gulp-uncss'),
  uglify = require('gulp-uglify');


//Simple Gulpfile for now, not perfect or near good but it works for me! ;)

// -------- Basic Usage ------------
// IMPORTANT: Run build first then gulp. To start over run gulp clean then gulp build, and run gulp again.

//  * gulp build - Builds the project for deployment and spits the assets inside the "dist" folder.

//  * gulp - Compiles JS/TS, SCSS. Minifies images, copy HTML files, concats JS and starts Browser-Sync server.

//  * gulp clean - WARNING: Deletes the "dist" folder and JS files. I set up Gulp to
// delete the regular JS files while I'm testing, keeping the TypeScript files only.
// TypeScript compiles to regular vanilla JS anyway but, the plugin is optional.

// -------- Top Level Functions ------------
//  * gulp.task - Define Tasks.
//  * gulp.src - The directory to grab files from.
//  * gulp.dest - Where you want the files to move or spit too.
//  * gulp.watch- Watch files and folders for changes.


// Default Watch ------------------------
gulp.task('default', ['serve']);

// ----------- Browser-Sync  ---------------
// Static Server + watching files:
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./src"
    });
    gulp.watch("src/scss/**/*.scss", ['sass']);
    // gulp.watch('src/images/**/*', ['imgMIN']);
    gulp.watch('./src/scripts/**/*.ts', ['tsc-P', 'conJS']);
    gulp.watch('./src/scripts/**/*.js', browserSync.reload);
    gulp.watch("./src/*.html").on('change', browserSync.reload);
});

// Compile Sass into CSS & auto-inject into browsers
// Piped in Sourcemaps, Auto-prefixer, Un-CSS etc..
gulp.task('sass', function() {
    return gulp.src("./src/scss/*.scss")
    .pipe(sourcemaps.init())
        .pipe(sass())
        .on("error", notify.onError(function(error) {
        return "Sass is Fkd Up!: " + error.message;
}))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
          }))
        .pipe(uncss({
            html: ['./src/**/*.html']
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./src/css/'))
        .pipe(gulp.dest('./dist/css/'))
        .pipe(browserSync.stream())
        .pipe(notify('Sassin!'));
});

// Minify CSS --------------------
gulp.task('minCSS', function () {
    return gulp.src('./src/css/index.css')
    .pipe(sourcemaps.init())
        .pipe(csso({
            restructure: false,
            sourceMap: true,
            debug: true
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/minified_assets/'));
});

// Compile TypeScript --------------------
// TypeScript compiles to vanilla JavaScript, so while I'm testing I can easly delete
// (gulp clean) the JavaScript files and keep the TypeScript files intact.
gulp.task('tsc-P', function () {
    return gulp.src('./src/scripts/ts/*.ts')
        .pipe(ts({
            noImplicitAny: true,
            outFile: 'app.js'
        }))
        .pipe(gulp.dest('./src/scripts'));
});

// Concat and uglify JS files -------------------------
gulp.task('conJS', function() {
  return gulp.src(['src/scripts/**/*.js', '!src/scripts/vendor/*.min.js'])
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/minified_assets/'))
    .pipe(notify({ message: 'JS got hit with an ugly stick'}));
});

// WARNING: Delete Files or Directories -----------
//del(['./src/scripts/*.js',  './dist' '!tmp/testing.js']).then(paths => {
//    console.log('Deleted files and folders:\n', paths.join('\n'));
//});
gulp.task('clean', function() {
    return del(['dist', './src/scripts/*.js']);
});

// WebP Images--------------------------
// WebP typically achieves an average of 30% more compression than JPEG and JPEG 2000,
// without loss of image quality:
// https://developers.google.com/speed/webp/
gulp.task('web-P', function () {
    return gulp.src('./dist/images/**/*.+(png|jpg|jpeg|gif|!svg)')
        .pipe(webp())
        .pipe(gulp.dest('./dist/minified_assets/webP_images/'));
});

// Minify Images--------------------------
gulp.task('imgMIN', () =>
    gulp.src('./src/images/**/*.+(png|jpg|jpeg|!gif|svg)')
      .pipe(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 5}),
          imagemin.svgo({plugins: [{removeViewBox: true}]})
      ]))
      .pipe(gulp.dest('./dist/images'))
);

// Copy All HTML files -------------------
gulp.task('copyHTML', function() {
    gulp.src('./src/*.html')
    .pipe(gulp.dest('./dist/'));
});


// Gulp Build Project --------------------
gulp.task('build', ['tsc-P', 'sass', 'copyHTML', 'imgMIN', 'minCSS', 'conJS']);
