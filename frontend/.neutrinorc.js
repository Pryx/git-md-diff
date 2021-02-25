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
    airbnb(),
    react({
      html: {
        title: 'Git md diff'
      },
      devServer:{
        "proxy": {
          "/auth/**/*": {
            "target": "http://backend:3000",
            "secure": false,
            "logLevel": "debug",
            "changeOrigin": false
          }
        },
      }
    }),
    jest(),
  ],
};

