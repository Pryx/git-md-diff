import {
  logIn,
  tokensReceived,
  logOut,
  revisionSelected,
  documentationSelected,
  documentationEmpty,
  pageAutosave,
  pageAutosaveRemove,
  updateChangesList,
  excludeChange,
  includeChange,
} from '../src/actions';
import rootReducer from '../src/reducers';

describe('Reducer tests', () => {
  it('logIn test', () => {
    expect(rootReducer(undefined, logIn('test'))).toStrictEqual(
      {
        userData: 'test',
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
      },
    );
  });

  it('tokensReceived test', () => {
    expect(rootReducer(undefined, tokensReceived({ token: 'test', refreshToken: 'reftest' })))
      .toStrictEqual(
        {
          userData: null,
          docuList: [],
          docuId: 0,
          autosaved: {},
          excludedChanges: [],
          token: 'test',
          refreshToken: 'reftest',
        },
      );
  });

  it('logOut test', () => {
    expect(rootReducer({ token: 'test', refreshToken: 'reftest' }, logOut()))
      .toStrictEqual({});
  });

  it('revisionSelected test', () => {
    let state = rootReducer(undefined, revisionSelected({ from: true, revisionData: 'test' }));
    expect(state).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
        startRevision: 'test',
      },
    );
    state = rootReducer(state, revisionSelected({ from: false, revisionData: 'test' }));
    expect(state).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
        startRevision: 'test',
        endRevision: 'test',
      },
    );
  });

  it('documentationSelected test', () => {
    expect(rootReducer(undefined, documentationSelected('test'))).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 'test',
        autosaved: {},
        docuEmpty: false,
        excludedChanges: [],
        endRevision: null,
        startRevision: null,
      },
    );
  });

  it('documentationEmpty test', () => {
    expect(rootReducer(undefined, documentationEmpty())).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
        docuEmpty: true,
      },
    );
  });

  it('updateChangesList test', () => {
    expect(rootReducer(undefined, updateChangesList(['test']))).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
        changes: ['test'],
      },
    );
  });

  it('excludeChange test', () => {
    const state = rootReducer(undefined, excludeChange('test'));
    expect(state).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: ['test'],
      },
    );

    expect(rootReducer(state, includeChange('test'))).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {},
        excludedChanges: [],
      },
    );
  });

  it('Autosave test', () => {
    const state = rootReducer(undefined, pageAutosave(1, 'test', 'content'));
    expect(state.autosaved[1].test.content).toBe('content');

    expect(rootReducer(state, pageAutosaveRemove(1, 'test'))).toStrictEqual(
      {
        userData: null,
        docuList: [],
        docuId: 0,
        autosaved: {
          1: {},
        },
        excludedChanges: [],
      },
    );
  });
});
