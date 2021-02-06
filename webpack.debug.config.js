'use strict';

const path = require('path')

module.exports = {
    node: {
        __dirname: false
    },
    mode: 'development',
    target: 'node',
    context: path.join(__dirname, 'src'),
	devtool: 'source-map',
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
        modules: [
            path.join(__dirname, './src'),
            "node_modules"
        ],
        alias: {
            './native': path.resolve(__dirname, 'src/node_modules_modifies/node-libpng/dist/native.js')
        }
    },
    entry: {
        "main.js": './main.ts',
    },
    output: {
		path: path.join(__dirname,'./out/'),
		filename: '[name]',
		libraryTarget: 'commonjs2',
		devtoolModuleFilenameTemplate: '[absolute-resource-path]'
    },
    module: {
        rules: [
            
            {
                test: /\.ts(x?)$/,
                use: 'ts-loader'
            },
            {
                test: /\.node$/,
                loader: 'node-loader',
            }
        ]
    },
    plugins: [],
};