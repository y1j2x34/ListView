"use strict";

var gulp = require("gulp");
var webserver = require("gulp-webserver");
var jshint = require("gulp-jshint");
var map = require("map-stream");

var concat = require("gulp-concat");
var rename = require("gulp-rename");

var uglify = require("gulp-uglify");
var sourcemap = require("gulp-sourcemaps");
var requirejsOptimize = require("gulp-requirejs-optimize");

var uglifycss = require("gulp-uglifycss");

var opts = require("./gulp.options.json");
var amdOptions = require("./amd.options.json");

gulp.task("webserver", webserverTask);
gulp.task("validatejs", validatejsTask);
gulp.task("optimizejs", ["validatejs"], optimizejsTask);
gulp.task("compressCss", compressCssTask);
gulp.task("default", ["optimizejs", "compressCss"]);


function webserverTask() {
    var stream = gulp.src("./").pipe(webserver(opts.webserver));
    stream.emit("kill");
}

var exitOnJshintError = map(function(file) {
    if (file.jshint && !file.jshint.success) {
        console.error("脚本错误！请修改正确后重新构建！");
        process.exit(1);
    }
});

function validatejsTask() {
    gulp.src(opts.source.js)
        .pipe(jshint())
        .pipe(jshint.reporter("default"))
        .pipe(exitOnJshintError);
}
function compressCssTask(){
    gulp
        .src("src/style/listview.css")
        .pipe(uglifycss({
            maxLineLen:70,
            uglyComments: true
        }))
        .pipe(rename("listview.min.css"))
        .pipe(gulp.dest(opts.optimize.dest));
}
function optimizejsTask() {
    var optimizeOptions = opts.optimize;

    var sourcemapOptions = {
        mapSources: function(sourcePath) {
            // 无特殊处理
            return sourcePath;
        }
    };
    var sourcemapWrieOptions = optimizeOptions.sourcemap.writeOptions;

    for (var key in sourcemapWrieOptions) {
        sourcemapOptions[key] = sourcemapWrieOptions[key];
    }
    gulp.src("src/script/listview.js")
        .pipe(sourcemap.init(optimizeOptions.sourcemap.initOptions))
        .pipe(requirejsOptimize(amdOptions))
        .pipe(concat("listview.js"))
        .pipe(gulp.dest(optimizeOptions.dest))
        .pipe(rename("listview.min.js"))
        .pipe(uglify(optimizeOptions.uglify))
        .pipe(sourcemap.write("/", sourcemapOptions))
        .pipe(gulp.dest(optimizeOptions.dest));

}