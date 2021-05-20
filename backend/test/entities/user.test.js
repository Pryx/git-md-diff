import User from '../../src/entities/user';

jest.mock('../../src/db', () => { });

describe('Token tests', () => {
  it('Test empty', () => {
    expect(new User()).toMatchObject({
      id: null,
      email: '',
      name: '',
      linked: {},
      tokens: {},
    });
  });

  it('Test basic', () => {
    expect(new User({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: { gitlab: { access: 'test', refresh: 'test1' } },
    })).toMatchObject({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: { gitlab: { access: 'test', refresh: 'test1' } },
    });
  });

  it('Test update tokens', () => {
    const user = new User({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: { gitlab: { access: 'test', refresh: 'test1' } },
    });

    user.updateTokens('p1', 'p2', 'p3');

    expect(user).toMatchObject({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: {
        gitlab: { access: 'test', refresh: 'test1' },
        p1: { access: 'p2', refresh: 'p3' },
      },
    });

    user.updateTokens('gitlab', 'g1', 'g2');
    expect(user).toMatchObject({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: {
        gitlab: { access: 'g1', refresh: 'g2' },
        p1: { access: 'p2', refresh: 'p3' },
      },
    });
  });

  it('Test public profile', () => {
    const user = new User({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
      linked: { gitlab: 5555 },
      tokens: { gitlab: { access: 'test', refresh: 'test1' } },
    });

    expect(user.getPublic()).toMatchObject({
      id: 5,
      email: 'example@example.com',
      name: 'Test User',
    });
  });
});
