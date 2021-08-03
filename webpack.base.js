module.exports = {
  mode: "development",
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "usage"    // polyfill异步执行的代码
                }
              ],
              "@babel/preset-react"
            ]
          }
        }
      }
    ]
  }
};
