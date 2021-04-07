const airbnb = require('@neutrinojs/airbnb');
const node = require('@neutrinojs/node');
const jest = require('@neutrinojs/jest');
const eslint = require('@neutrinojs/eslint');

module.exports = {
  options: {
    root: __dirname,
  },
  use: [
    airbnb({
      eslint: {
        baseConfig: {
          plugins: ['babel', 'react', 'react-hooks'],
          settings: {
            react: {
              version: 'detect',
            },
          }
        }
      }
    }),
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
      }
    }
    ),
    jest(),
  ],
};
