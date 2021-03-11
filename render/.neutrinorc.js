const airbnbBase = require('@neutrinojs/airbnb-base');
const node = require('@neutrinojs/node');
const jest = require('@neutrinojs/jest');

module.exports = {
  options: {
    root: __dirname,
  },
  use: [
    airbnbBase(),
    node({
      babel: {
        // Override options for @babel/preset-env:
        presets: [
          [
            "@babel/preset-react",
            {
              development: process.env.BABEL_ENV === "development",
            },
            '@babel/preset-env',
            {
              useBuiltIns: 'usage',
            },
          ],
        ],
      },
    }
    ),
    jest(),
  ],
};
