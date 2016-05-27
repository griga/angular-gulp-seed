// sails dependencies
// npm install ejs rc sails sails-disk sails-mongo
// gulp dependencies 
// npm install event-stream gulp gulp-concat gulp-angular-templatecache gulp-ng-annotate gulp-uglify gulp-babel babel-preset-es2015 lodash gulp-sass gulp-livereload --save-dev
// bower install lodash moment codemirror angular angular-resource angular-animate angular-aria angular-messages angular-material  angular-ui-router angular-ui-codemirror 

var es = require('event-stream');
var gulp = require('gulp');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var fs = require('fs');
var babel = require('gulp-babel')
var iife = require('gulp-iife')
var _ = require('lodash');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var gulpIf = require('gulp-if');

var sources = {
    app: {
        main: 'src/app/main.js',
        src: [
            'src/app/main.js',
            'src/app/app.js',
            'src/app/**/*module.js',
            'src/app/**/!(module)*.js'
        ],
        html: 'src/app/**/*.html',
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
        paths: {
            prod: [
                // "node_modules/lodash/dist/lodash.min.js",
                "node_modules/angular/angular.min.js",
                "node_modules/angular-animate/angular-animate.min.js",
                "node_modules/angular-aria/angular-aria.min.js",
                "node_modules/angular-messages/angular-messages.min.js",
                // "node_modules/angular-material/angular-material.min.js",
                "node_modules/angular-ui-router/release/angular-ui-router.js",
                "node_modules/angular-material/modules/js/core/core.js",
                "node_modules/angular-material/modules/js/input/input.js",

            ],
            dev: [
                // "node_modules/lodash/dist/lodash.js",
                "node_modules/angular/angular.js",
                "node_modules/angular-animate/angular-animate.js",
                "node_modules/angular-aria/angular-aria.js",
                "node_modules/angular-messages/angular-messages.js",
                // "node_modules/angular-material/angular-material.js",
                "node_modules/angular-ui-router/release/angular-ui-router.min.js",
                "node_modules/angular-material/modules/js/core/core.min.js",
                "node_modules/angular-material/modules/js/input/input.min.js",
            ]
        }
    },
    assets: {
        src: [
            'src/static/**/*.*'
        ]
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
    },
    prod: {
        root: "./dist",
        js: './dist/js',
        css: './dist/css',
    },
};


function compile(appName, target) {
    var bundle = es.merge(
        gulp.src(sources[appName].src)
        , getTemplateStream(appName))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(iife())
        .on('error', swallowError)
        .pipe(concat(sources[appName].out))
        .pipe(gulpIf(target == 'prod', ngAnnotate()))
        .pipe(gulpIf(target == 'prod', uglify()))

    return bundle.pipe(gulp.dest(destinations[target].js)).pipe(connect.reload());
}

gulp.task('compile-dev', compile.bind(this, 'app', 'dev'))
gulp.task('compile-prod', compile.bind(this, 'app', 'prod'))

gulp.task('watch', function () {
    gulp.watch(sources.sass.src, ['sass-dev']);
    gulp.watch(sources.app.src, ['compile-dev']);
    gulp.watch(sources.app.html, ['compile-dev']);
    gulp.watch(sources.assets.src, ['assets-dev']);
});


function vendorJs(target) {
    var paths = sources.vendor.paths[target]
    paths.forEach(function (p) {
        if (!fs.existsSync(__dirname + '/' + p)) {
            throw new Error(p + ' not exist')
        }
    });
    return gulp.src(paths)
        .pipe(concat('vendor.bundle.js'))
        //.on('error', swallowError)
        .pipe(gulp.dest(destinations[target].js))
}
gulp.task('vendor-prod', vendorJs.bind(this, 'prod'));
gulp.task('vendor-dev', vendorJs.bind(this, 'dev'));


function vendorCss(target) {
    return gulp.src(sources.css)
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(destinations[target].css))
}
gulp.task('vendor-css-dev', vendorCss.bind(this, 'dev'))
gulp.task('vendor-css-prod', vendorCss.bind(this, 'prod'))


function compileSass(target) {
    return gulp.src(sources.sass.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(destinations[target].css))
        .pipe(connect.reload());
}

gulp.task('sass-dev', compileSass.bind(this, 'dev'));
gulp.task('sass-prod', compileSass.bind(this, 'prod'));

function copyAssets(target) {
    return gulp.src(sources.assets.src)
        .pipe(gulp.dest(destinations[target].root))
        .pipe(connect.reload())
}

gulp.task('assets-dev', copyAssets.bind(this, 'dev'));
gulp.task('assets-prod', copyAssets.bind(this, 'prod'));


gulp.task('connect', function () {
    return connect.server({
        root: '.tmp',
        port: 9901,
        livereload: true
    })
})


gulp.task('prod', ['vendor-prod', 'vendor-css-prod', 'sass-prod', 'compile-prod', 'assets-prod']);
gulp.task('dev', ['connect', 'vendor-dev', 'vendor-css-dev', 'sass-dev', 'compile-dev', 'watch', 'assets-dev']);
gulp.task('default', ['dev']);

var swallowError = function (error) {
    console.log(error.toString());
    this.emit('end')
};

var getTemplateStream = function (key) {
    return gulp.src(sources[key].html)
        .pipe(templateCache({
            root: 'app/',
            module: 'ng'
        }))
};