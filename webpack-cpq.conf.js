const ArcGISPlugin = require('@arcgis/webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Terser = require('terser');

const webpack = require('webpack');
const dotenv = require('dotenv').config({path: __dirname + '/.env'});
const parsedEnv = dotenv.parsed || {};
const path = require('path');
const modulesLocation = path.join(__dirname, '/node_modules');

const optimize = (fileContent, path) =>
  Terser.minify(fileContent.toString()).code.toString();

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
console.log(__dirname);
module.exports = {
  plugins: [
    new webpack.EnvironmentPlugin({
      'ESRI_PORTAL_SERVER': parsedEnv.ESRI_PORTAL_SERVER,
      'ESRI_USERNAME': parsedEnv.ESRI_USERNAME,
      'ESRI_PASSWORD': parsedEnv.ESRI_PASSWORD,
      'IS_LOCAL_BUILD': (parsedEnv.ESRI_PORTAL_SERVER != null)
    }),
    new ArcGISPlugin({
      features: {
        "3d": false,
        has: {
          'esri-native-promise': true
        }
      },
      options: {
        root: modulesLocation,
        buildEnvironment: {
          root: modulesLocation
        },
        locales: ['en']
      }
    }),
    new CopyWebpackPlugin([
      {
        from: "dojo/resources/blank.gif",
        to: "dojo/resources"
      },
      {
        from: "@arcgis/webpack-plugin/extras/dojo/",
        to: "dojo/"
      },
      {
        from: "@arcgis/webpack-plugin/extras/dojo/dojo.js",
        to: "dojo/dojo-lite.js"
      },
      {
        from: "arcgis-js-api/workers/",
        to: "arcgis-js-api/workers/",
        transform: optimize
      },
      {
        from: "arcgis-js-api/core/workers/",
        to: "arcgis-js-api/core/workers/"
      },
      {
        from: "arcgis-js-api/core/workers/worker.js",
        to: "arcgis-js-api/core/workers/worker.js",
        transform: optimize
      },
      {
        from: "arcgis-js-api/views/2d/layers/features/",
        to: "arcgis-js-api/views/2d/layers/features/"
      },
      {
        from: "arcgis-js-api/layers/graphics/sources/support/",
        to: "arcgis-js-api/layers/graphics/sources/support/"
      },
      // geometry engine worker
      {
        from: "arcgis-js-api/geometry/geometryenginewebworker.js",
        to: "arcgis-js-api/geometry/geometryenginewebworker.js"
      },
      // crosshatch symbol images
      {
        from: "arcgis-js-api/symbols/patterns/",
        to: "arcgis-js-api/symbols/patterns/"
      }
    ], { context: modulesLocation }),
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

// devtool: 'eval'