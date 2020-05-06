const ArcGISPlugin = require('@arcgis/webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Terser = require('terser');

const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const modulesLocation = path.join(__dirname, '/node_modules');

const optimize = (fileContent, path) =>
  Terser.minify(fileContent.toString()).code.toString();

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
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
        from: "arcgis-js-api/images/",
        to: "arcgis-js-api/images/"
      },
      {
        from: "arcgis-js-api/views/3d/environment/resources/stars.wsv",
        to: "arcgis-js-api/views/3d/environment/resources/stars.wsv"
      },
      {
        from: "arcgis-js-api/geometry/support/pe-wasm.wasm",
        to: "arcgis-js-api/geometry/support/pe-wasm.wasm"
      },
      {
        from: "arcgis-js-api/themes/base/images/",
        to: "arcgis-js-api/themes/base/images/"
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
      // charts libs and locale
      {
        from: "arcgis-js-api/libs/amcharts4/",
        to: "esri/libs/amcharts4/"
      },
      // Copy the moment locales
      // so they can be dynamically loaded
      {
        from: "moment/locale/",
        to: "moment/locale/"
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
      },
      // silent renew page for JWT renewal
      {
        context: '../applications/impower',
        from: "silent-refresh.html",
        to: "silent-refresh.html"
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
