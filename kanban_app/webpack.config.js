const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');

// Load *package.json* so we can use `dependencies` from there
const pkg = require('./package.json');

const TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;
const PATHS = {
    app: path.join(__dirname, 'app'),
    build: path.join(__dirname, 'build')
};

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');

const common = {
    entry: {
        app: PATHS.app
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: PATHS.build,
        filename: '[name].js',
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loaders: ['style', 'css'],
                include: PATHS.app
            },
            {
                test: /\.jsx?$/,
                loader: 'babel',
                include: PATHS.app
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'node_modules/html-webpack-template/index.ejs',
            title: 'Kanban app',
            appMountId: 'app',
            inject: false
        })
    ]
};

// Default configuration
if (TARGET === 'start' || !TARGET) {
    module.exports = merge(common, {
        devServer: {
            // Enable history API fallback so HTML5 History API based routing
            // works. This is a good default that will come in handy in more
            // complicated setups.
            historyApiFallback: true,
            hot: true,
            inline: true,
            progress: true,

            // Display only errors to reduce the amount of output.
            stats: 'error-only',

            // Parse host and port from env so this is easy to customize.
            host: process.env.HOST,
            port: process.env.PORT
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ],
        devtool: 'eval-source-map'
    });
}

if (TARGET === 'build' || TARGET === 'stats') {
    module.exports = merge(common, {
        // Define vendor entry point needs for splitting
        entry: {
            vendor: Object.keys(pkg.dependencies).filter(function(v) {
                // Exclude alt-utils as it won't work with this setup due to
                // the way package has been designed
                // (no package.json main).
                return v !== 'alt-utils';
            })
        },
        output: {
            path: PATHS.build,
            filename: '[name].[chunkhash].js',
            chunkFilename: '[chunkhash].js'
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': 'production'
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            }),
            // Extract vendor and manifest files
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor', 'manifest']
            }),
            new CleanPlugin([PATHS.build]),
        ]
    });
}
