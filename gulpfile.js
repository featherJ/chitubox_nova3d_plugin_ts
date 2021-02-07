'use strict';

const gulp = require('gulp');
const del = require('del');
const webpack = require('webpack');
const fs = require('fs');
const paths = require('path');
const zip = require('gulp-zip');
const { series, src, dest, watch } = require('gulp');



gulp.task('build', (callback) => {
    del(['./build']).then(() => {
        del(['./build-release']).then(() => {
            let config = require('./webpack.config.js');
            webpack(config, (err, stats) => {
                if (err) {
                    console.log('fuck');
                    console.error('webpack', err);
                    return;
                }

                var data1 = fs.readFileSync(paths.join(__dirname, "plugin.bat"));
                var targetPath1 = paths.join(__dirname, "./build/plugin.bat")
                fs.writeFileSync(targetPath1, data1);

                var data2 = fs.readFileSync(paths.join(__dirname, "macshell.command"));
                var targetPath2 = paths.join(__dirname, "./build/macshell.command")
                fs.writeFileSync(targetPath2, data2);

                var data3 = fs.readFileSync(paths.join(__dirname, "plugin.json"));
                var targetPath3 = paths.join(__dirname, "./build/plugin.json")
                fs.writeFileSync(targetPath3, data3);

                callback();
            });
        });
    })
});


gulp.task('copy', gulp.series('build', (callback) => {
    src('./execs/node')
        .pipe(gulp.dest('./build/')).on('end', function () {
            callback();
        });
}));

gulp.task('release', gulp.series('copy', (callback) => {
    src('build/**/*')
        .pipe(zip('Nova3DPlugin.CHplugin'))
        .pipe(gulp.dest('build-release')).on('end', function () {
            callback();
        });
}));