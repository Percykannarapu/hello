const ArcGISPlugin = require("@arcgis/webpack-plugin");
const webpack = require('webpack');
const dotenv = require('dotenv').config({path: __dirname + '/.env'});
const parsedEnv = dotenv.parsed || {};

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  plugins: [
    new webpack.EnvironmentPlugin({
      'ESRI_PORTAL_SERVER': parsedEnv.ESRI_PORTAL_SERVER,
      'ESRI_USERNAME': parsedEnv.ESRI_USERNAME,
      'ESRI_PASSWORD': parsedEnv.ESRI_PASSWORD,
      'IS_LOCAL_BUILD': (parsedEnv.ESRI_PORTAL_SERVER != null)
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
