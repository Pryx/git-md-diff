import Role from '../../src/entities/role';

jest.mock('../../src/db', () => { });

describe('Role tests', () => {
  it('Test empty', () => {
    expect(new Role()).toMatchObject({
      level: -1,
      docuId: -1,
      userId: -1,
    });
  });

  it('Test basic', () => {
    expect(new Role({
      level: 1,
      docuId: 5,
      userId: 2,
    })).toMatchObject({
      level: 1,
      docuId: 5,
      userId: 2,
    });
  });

  it('Test lowercase', () => {
    expect(new Role({
      level: 1,
      docuid: 5,
      userid: 2,
    })).toMatchObject({
      level: 1,
      docuId: 5,
      userId: 2,
    });
  });
});
