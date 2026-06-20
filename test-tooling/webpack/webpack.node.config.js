const path = require("path")

module.exports = {
  context: __dirname,
  mode: "development",
  devtool: false,
  entry: require.resolve("./webpack-entry.ts"),
  output: {
    library: {
      type: "commonjs2",
      export: "default"
    },
    path: path.resolve(__dirname, "./dist/app.node")
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          compilerOptions: {
            module: "esnext"
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  target: "node"
}
