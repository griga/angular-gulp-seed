const es = require('event-stream');
const gulp = require('gulp');
const concat = require('gulp-concat');
const templateCache = require('gulp-angular-templatecache');
const ngAnnotate = require('gulp-ng-annotate');
const uglify = require('gulp-uglify');
const fs = require('fs');
const babel = require('gulp-babel')
const iife = require('gulp-iife')
const _ = require('lodash');
const sass = require('gulp-sass');
const connect = require('gulp-connect');
const open = require('gulp-open');
const gulpIf = require('gulp-if');


const conf = {
    host: 'localhost',
    port: 10020,
}
const sources = {
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
                "node_modules/angular-material/angular-material.min.js",
                "node_modules/angular-ui-router/release/angular-ui-router.js",

            ],
            dev: [
                // "node_modules/lodash/dist/lodash.js",
                "node_modules/angular/angular.js",
                "node_modules/angular-animate/angular-animate.js",
                "node_modules/angular-aria/angular-aria.js",
                "node_modules/angular-messages/angular-messages.js",
                "node_modules/angular-material/angular-material.js",
                "node_modules/angular-ui-router/release/angular-ui-router.min.js",
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

const destinations = {
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
        port: conf.port,
        livereload: true
    })
})

gulp.task('open', function () {
    return gulp.src(__filename)
        .pipe(open({uri: 'http://' + conf.host + ':' + conf.port}));
});


gulp.task('prod', ['vendor-prod', 'vendor-css-prod', 'sass-prod', 'compile-prod', 'assets-prod']);
gulp.task('dev', ['connect', 'vendor-dev', 'vendor-css-dev', 'sass-dev', 'compile-dev', 'watch', 'assets-dev', 'open']);
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