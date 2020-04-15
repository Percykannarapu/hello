const ArcGISPlugin = require("@arcgis/webpack-plugin");
const webpack = require('webpack');
const dotenvWebpack = require('dotenv-webpack');

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  plugins: [
    new webpack.EnvironmentPlugin(),
    new dotenvWebpack({
      systemvars: true,
    }),
    new ArcGISPlugin({
      options: {
        buildEnvironment: {
          root: "../../node_modules"
        }
      }
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 5,
    })
  ],
  node: {
    process: false,
    global: false,
    fs: "empty"
  },

};

// devtool: 'eval'
