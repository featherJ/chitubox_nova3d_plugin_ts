'use strict';

const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    mode: 'production',
    target: 'node',
    context: path.join(__dirname, 'src'),
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
        modules: [
            path.join(__dirname, './src'),
            "node_modules"
        ]
    },
    entry: {
        "main.js": './main.ts',
    },
    output: {
		filename: '[name]',
		libraryTarget: 'commonjs2',
        path: path.join(__dirname, './build'),
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                use: 'ts-loader'
            }

        ]
    },
    plugins: [
        new UglifyJsPlugin({
			sourceMap:false,
			uglifyOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true
				},
				output:{
					comments:false
				}
			}
		})
    ],
};