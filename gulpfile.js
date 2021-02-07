'use strict';

const gulp = require('gulp');
const del = require('del');
const webpack = require('webpack');
const fs = require('fs');
const paths = require('path');
const zip = require('gulp-zip');
const { series, src, dest, watch } = require('gulp');


var pluginConfigStr = fs.readFileSync(paths.resolve(__dirname, 'plugin.json'));
var pluginConfig = JSON.parse(pluginConfigStr);

gulp.task('build', (callback) => {
    del(['./build']).then(() => {
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
    })
});


gulp.task('release', gulp.series('build', (callback) => {
    src('./execs/node')
        .pipe(gulp.dest('./build/')).on('end', function () {
            callback();
        })
}, (callback) => {
    src('build/**/*')
        .pipe(zip('Nova3DPlugin.CHplugin'))
        .pipe(gulp.dest('build')).on('end', function () {
            callback();
        });
}, (callback) => {
    var releaseDir = paths.resolve(__dirname, 'build-release');
    if (!fs.existsSync(releaseDir)) {
        fs.mkdirSync(releaseDir);
    }
    var versionStr = pluginConfig.info.version;
    versionStr = versionStr.replace(/\./g,'_');
    var targetPath = paths.resolve(releaseDir, 'Nova3DPlugin_' + versionStr + '.CHplugin');
    if(fs.existsSync(targetPath)){
        fs.unlinkSync(targetPath);
    }
    fs.renameSync(paths.resolve(__dirname, 'build', 'Nova3DPlugin.CHplugin'), targetPath)
    callback();
}));