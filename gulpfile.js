var fs = require('fs');
var path = require('path');

var argv = require('yargs').argv;

var es = require('event-stream');
var gulp = require('gulp');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel')
var iife = require('gulp-iife')
var _ = require('lodash');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var inject = require('gulp-inject-string');
var connect = require('gulp-connect');
var gulpIf = require('gulp-if');

var spritesmith = require('gulp.spritesmith');

var staticHash = require('gulp-static-hash');
var del = require('del');

var TARGET = argv.prod ? 'prod' : 'dev';

var sources = {
  app: {
    main: './src/app/main.js',
    src: [
      './src/app/main.js',
      './src/app/app.js',
      './src/app/**/*module.js',
      './src/app/**/!(module)*.js'
    ],
    html: './src/app/**/*.html',
    out: 'bundle.js',
  },
  sass: {
    main: 'src/sass/style.scss',
    src: [
      'src/sass/**/*.scss',
    ]
  },
  css: [],
  vendor: {
    prod: [
      // "node_modules/lodash/dist/lodash.min.js",
      "node_modules/angular/angular.min.js",
      "node_modules/angular-mocks/angular-mocks.js",
      "node_modules/angular-animate/angular-animate.min.js",
      "node_modules/angular-aria/angular-aria.min.js",
      "node_modules/angular-messages/angular-messages.min.js",
      "node_modules/angular-material/angular-material.min.js",
      "node_modules/angular-ui-router/release/angular-ui-router.js",

    ],
    dev: [
      // "node_modules/lodash/dist/lodash.js",
      "node_modules/angular/angular.js",
      "node_modules/angular-mocks/angular-mocks.js",
      "node_modules/angular-animate/angular-animate.js",
      "node_modules/angular-aria/angular-aria.js",
      "node_modules/angular-messages/angular-messages.js",
      "node_modules/angular-material/angular-material.js",
      "node_modules/angular-ui-router/release/angular-ui-router.min.js",
    ]
  },
  assets: {
    src: [
      'src/static/**/*.*',
      '!src/static/img/icons/**/*'
    ]
  },
  sprite: {
    src: ['./src/static/img/icons/**/*.png']
  },
  cleanup: {
    dev: ['.tmp/**/*'],
    prod: ['dist/**/*'],
  },
  html: {
    main: 'src/index.html'
  }


};

var destinations = {
  dev: {
    root: "./.tmp",
    js: './.tmp/js',
    css: './.tmp/css',
    img: './.tmp/img',
  },
  prod: {
    root: "./dist",
    js: './dist/js',
    css: './dist/css',
    img: './dist/img',
  },
};



gulp.task('compile', function () {
    var bundle = es.merge(
      gulp.src(sources.app.src)
      , getTemplateStream())
      .pipe(babel({
        presets: ['es2015']
      }))
      .pipe(iife({
        useStrict: false,
      }))
      .on('error', swallowError)

      .pipe(concat(sources.app.out))
      .pipe(gulpIf(TARGET == 'prod', ngAnnotate()))
      .pipe(gulpIf(TARGET == 'prod', uglify()))
      .pipe(inject.prepend(';window.AIRWANDER_GLOBALS={environment: "' + TARGET + '"};'))



  return bundle.pipe(gulp.dest(destinations[TARGET].js)).pipe(connect.reload());
  }
)

gulp.task('watch', function () {
  gulp.watch(sources.sass.src, ['sass']);
  gulp.watch(sources.app.src, ['compile']);
  gulp.watch(sources.app.html, ['compile']);
  gulp.watch(sources.assets.src, ['assets']);
  gulp.watch(sources.sprite.src, ['sprite', 'sass']);
});


gulp.task('vendor', function () {
    var paths = sources.vendor[TARGET]
    paths.forEach(function (p) {
      if (!fs.existsSync(__dirname + '/' + p)) {
        throw new Error(p + ' not exist')
      }
    });
    return gulp.src(paths)

      .pipe(concat('vendor.bundle.js'))
      //.on('error', swallowError)
      .pipe(gulp.dest(destinations[TARGET].js))
  }
);


gulp.task('vendor-css', function () {
    return gulp.src(sources.css)
      .pipe(concat('bundle.css'))
      .pipe(gulp.dest(destinations[TARGET].css))
  }
)


gulp.task('sass', function() {
    return gulp.src(sources.sass.src)
      .pipe(sass().on('error', sass.logError))
      .pipe(gulpIf(TARGET == 'prod', autoprefixer()))
      .pipe(gulp.dest(destinations[TARGET].css))
      // .pipe(references(gulp.src(sources.html.main)))
      .pipe(connect.reload());
  }
);


gulp.task('rev', function(){
  return gulp.src('./dist/index.html')
    .pipe(staticHash())
    .pipe(gulp.dest(destinations.prod.root));

})


gulp.task('assets', function () {
    return gulp.src(sources.assets.src)
      .pipe(gulp.dest(destinations[TARGET].root))
      .pipe(connect.reload())
  }
);


gulp.task('cleanup', function () {
  return del(sources.cleanup[TARGET])
});


gulp.task('sprite', function () {
  var spriteData = gulp.src(sources.sprite.src).pipe(spritesmith({
    imgName: 'sprite.png',
    imgPath: '../img/sprite.png',
    cssName: '_sprite.scss'
  }));
  return spriteData.pipe(gulpIf('*.png', gulp.dest(
    destinations[TARGET].img), gulp.dest('./src/sass/components/')));
});


gulp.task('serve', function () {
  return connect.server({
    root: '.tmp',
    port: 9080,
    livereload: true
  })
})

gulp.task('build', [
  'cleanup',
  'sprite',
  'vendor',
  'vendor-css',
  'sass',
  'compile',
  'assets',
  'rev',
]);
gulp.task('dev', [
  'build',
  'serve',
  'watch',
]);
gulp.task('default', ['dev']);

var swallowError = function (error) {
  console.log(error.toString());
  this.emit('end')
};

var getTemplateStream = function () {
  return gulp.src(sources.app.html)
    .pipe(templateCache({
      root: 'app/',
      module: 'ng'
    }))
};


gulp.task('imgd', function(){
  let idir = path.resolve(__dirname, 'src/static/img/icons');
  fs.readdirSync(idir).forEach(function(it){
    fs.renameSync(
      path.resolve(idir, it),
      path.resolve(idir, it.replace(/_/gm, '-'))
    )
  })
})
