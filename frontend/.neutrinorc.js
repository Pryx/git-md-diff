const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');
const path = require('path');

module.exports = {
  options: {
    root: __dirname,
  },
  node: {
    fs: 'empty'
  },
  use: [
    airbnb({
      eslint: {
        rules: {
          'max-len': 1,
        },
      }
    }),
    react({
      html: {
        template: require.resolve(path.join(__dirname, 'index.ejs')),
        title: 'Git md tdiff',
      },
      devServer:{
        contentBase: [
          path.resolve(__dirname, 'build'),
          path.join(__dirname, 'public')
        ],
        publicPath: '/',
        historyApiFallback: {
          disableDotRule: true
        }
      }
    }),
    jest(),
  ],
};

