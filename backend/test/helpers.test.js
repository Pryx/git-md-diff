import descriptiveError from '../src/helpers';

describe('Helper tests', () => {
  it('Descriptive errors', () => {
    expect(descriptiveError({ description: { Hello: 'world', how: 'are you?' } }))
      .toBe('Hello world, how are you?');

    expect(descriptiveError({ description: 'Hello?' }))
      .toBe('Hello?');

    expect(descriptiveError(Error('Response not found')))
      .toBe('Error: Response not found');

    // This shouldn't happen, so this is expected
    expect(descriptiveError({}))
      .toBe('[object Object]');

    // This shouldn't happen
    expect(descriptiveError(null))
      .toBe('<no error message>');
  });
});
