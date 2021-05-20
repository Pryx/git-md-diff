import RefreshToken from '../../src/entities/refresh-token';

jest.mock('../../src/db', () => { });

describe('Token tests', () => {
  it('Test empty', () => {
    expect(new RefreshToken()).toMatchObject({
      userId: -1,
      hash: '',
      expire: 0,
    });
  });

  it('Test basic', () => {
    expect(new RefreshToken({
      userId: 5,
      hash: 'xxx',
      expire: 20,
    })).toMatchObject({
      userId: 5,
      hash: 'xxx',
      expire: 20,
    });
  });

  it('Test lowercase', () => {
    expect(new RefreshToken({
      userid: 5,
      hash: 'xxx',
      expire: 20,
    })).toMatchObject({
      userId: 5,
      hash: 'xxx',
      expire: 20,
    });
  });
});
