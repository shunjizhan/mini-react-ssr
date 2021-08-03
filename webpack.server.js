const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const nodeExternals = require('webpack-node-externals');

const config = {
  target: 'node',
  entry: './src/server/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.bundle.js'
  },
  externals: [nodeExternals()]    // 因为本身target就是node，所以不需要把node运行时的modules打包进bundle
}

module.exports = merge(baseConfig, config);