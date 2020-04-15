const ArcGISPlugin = require("@arcgis/webpack-plugin");
const webpack = require('webpack');
const dotenv = require('dotenv').config({path: __dirname + '/.env'});

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  plugins: [
    new webpack.EnvironmentPlugin({
      'ESRI_PORTAL_SERVER': dotenv.ESRI_PORTAL_SERVER,
      'ESRI_USERNAME': dotenv.ESRI_USERNAME,
      'ESRI_PASSWORD': dotenv.ESRI_PASSWORD
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
  }
};

// devtool: 'eval'
