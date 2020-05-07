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
      },
      // silent renew page for JWT renewal
      {
        context: 'applications/impower',
        from: "silent-refresh.html",
        to: "silent-refresh.html"
      },
      {
        context: 'applications/impower',
        from: "assets/data",
        to: "assets/data"
      },
      {
        context: 'applications/impower',
        from: "assets/sample",
        to: "assets/sample"
      },
      {
        context: 'applications/impower',
        from: "assets/favicon.png",
        to: "favicon.png"
      }
    ])
  ],
  node: {
    process: false,
    global: false,
    Buffer: false,
    fs: "empty"
  }
};
