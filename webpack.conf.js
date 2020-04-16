const ArcGISPlugin = require("@arcgis/webpack-plugin");
const webpack = require('webpack');
const dotenv = require('dotenv').config({path: __dirname + '/.env'});

console.log('Webpack config started. dotenv Url is set:', dotenv.parsed.ESRI_PORTAL_SERVER != null);

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  plugins: [
    new webpack.EnvironmentPlugin({
      'ESRI_PORTAL_SERVER': dotenv.parsed.ESRI_PORTAL_SERVER,
      'ESRI_USERNAME': dotenv.parsed.ESRI_USERNAME,
      'ESRI_PASSWORD': dotenv.parsed.ESRI_PASSWORD
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
