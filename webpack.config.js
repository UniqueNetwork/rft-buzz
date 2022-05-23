const path = require('path');

module.exports = {
  entry: './src/rft-helpers.js',
  output: {
    filename: 'rft-helpers.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      "zlib": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": false,
      "crypto-browserify": require.resolve('crypto-browserify'),
    } 
  },
};