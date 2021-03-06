const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const outputDirectory = 'build';

module.exports = {
  entry: ['babel-polyfill', './src/client/index.js'],
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    },
    {
      test: /\.s[ac]ss$/i,
      // use: [
      //   'style-loader',
      //   {
      //     loader: 'css-loader',
      //     options: {
      //       modules: {
      //         localIdentName: '[local]--[hash:base64:5]',
      //       },
      //     },
      //   },
      //   'resolve-url-loader',
      //   {
      //     loader: 'sass-loader',
      //     options: {
      //       sourceMap: true,
      //     },
      //   },
      // ],
      use: [
        // Creates `style` nodes from JS strings
        "style-loader",
        // Translates CSS into CommonJS
        "css-loader",
        // Compiles Sass to CSS
        "sass-loader",
      ],
    },
    {
      test: /\.(png|woff|woff2|eot|ttf)$/,
      loader: 'url-loader'
    },
    {
      test: /.svg$/,
      use: ['@svgr/webpack'],
    },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  devServer: {
    port: 3000,
    open: true,
  },
  target: 'electron-renderer',
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    })
  ]
};
