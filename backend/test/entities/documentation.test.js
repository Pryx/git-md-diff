import Documentation from '../../src/entities/documentation';

jest.mock('../../src/db', () => {});

describe('Documentation tests', () => {
  it('Test empty', () => {
    expect(new Documentation()).toMatchObject({
      id: -1,
      provider: '',
      providerId: '',
      name: '',
      description: '',
      slug: '',
    });
  });

  it('Test basic', () => {
    expect(new Documentation({
      id: 5,
      provider: 'test',
      providerId: 'test',
      name: 'test',
      description: 'test',
      slug: 'test',
    })).toMatchObject({
      id: 5,
      provider: 'test',
      providerId: 'test',
      name: 'test',
      description: 'test',
      slug: 'test',
    });
  });

  it('Test lowercase', () => {
    expect(new Documentation({
      id: 5,
      provider: 'test',
      providerid: 'test',
      name: 'test',
      description: 'test',
      slug: 'test',
    })).toMatchObject({
      id: 5,
      provider: 'test',
      providerId: 'test',
      name: 'test',
      description: 'test',
      slug: 'test',
    });
  });
});
