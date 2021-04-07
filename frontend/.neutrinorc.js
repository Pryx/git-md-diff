const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');

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
        title: 'Git md diff'
      },
      devServer:{
        historyApiFallback: {
          disableDotRule: true
        },    
        "proxy": {
          "/api/render": {
            "target": "http://render:4000",
            "secure": false,
            pathRewrite: { '^/api': '' },
          },
          "/api": {
            "target": "http://backend:3000",
            "secure": false,
            pathRewrite: { '^/api': '' },
          }
        },
      }
    }),
    jest(),
  ],
};

