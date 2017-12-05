/**
 * Common setting for all webpack build
 */
const webpack = require("webpack");
const path = require("path");
const Visualizer = require("webpack-visualizer-plugin");

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  entry: {
    "plato": [
      // "core-js/client/shim",
      path.join(__dirname, "..", "lib-ts", "plato.tsx"),
    ],
  },
  output: {
    path: path.join(__dirname, "..", "public"),
    filename: "static/[name].js",
    // prefix "sourcemap" can be used to distinguish and reject public access
    sourceMapFilename: "static/sourcemap/[name].map"
  },

  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    antd: "antd",
    moment: "moment",
    lodash: "_",
  },

  module: {
    loaders: [
      // load ts/tsx with ts-loader
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          // enable transpileOnly in prod, for better type check
          // (it prevents webpack HMR)
          transpileOnly: process.env.NODE_ENV !== "production",

          compilerOptions: {
            // use target=es5 for old browsers
            target: "es5",
            // use module=es6 for tree-shaking and stuff
            module: "ES6",
            lib: ["ES6", "DOM"],
            moduleResolution: "Node",
          }
        }
      },
    ]
  },
  plugins: [
    new Visualizer(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  devtool: "source-map"
};
