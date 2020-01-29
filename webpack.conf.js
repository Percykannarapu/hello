const ArcGISPlugin = require("@arcgis/webpack-plugin");

/**
 * Configuration items defined here will be appended to the end of the existing webpack config defined by the Angular CLI.
 */
module.exports = {
  plugins: [new ArcGISPlugin({
    options: {
      buildEnvironment: {
        root: "../../node_modules"
      }
    }
  })],
  node: {
    process: false,
    global: false,
    fs: "empty"
  },

};

// devtool: 'eval'
