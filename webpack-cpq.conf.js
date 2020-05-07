const webpack = require('webpack');
const ArcGISPlugin = require('@arcgis/webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  context: __dirname,
  plugins: [
    new Dotenv({
      systemvars: true,
    }),
    new ArcGISPlugin({
      features: {
        "3d": false,
        has: {
          'esri-native-promise': true
        }
      },
      options: {
        locales: ['en']
      }
    }),
    new CopyWebpackPlugin([
      // crosshatch symbol images
      {
        context: 'node_modules',
        from: "arcgis-js-api/symbols/patterns/",
        to: "arcgis-js-api/symbols/patterns/"
      }
    ]),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 5,
    })
  ],
  node: {
    process: false,
    global: false,
    Buffer: false,
    fs: "empty"
  }
};
