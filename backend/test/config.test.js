const fs = require('fs');

jest.mock('fs');

describe('Config tests', () => {
  it('Test nonexistent file', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('Error reading file...');
    });
    expect(() => {
      require('../src/config'); //eslint-disable-line
    }).toThrow();
  });
});
