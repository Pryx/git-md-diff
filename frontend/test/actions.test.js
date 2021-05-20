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

describe('Action tests', () => {
  it('logIn test', () => {
    expect(logIn('test')).toStrictEqual(
      { type: 'LOGIN', payload: 'test' },
    );
  });

  it('tokensReceived test', () => {
    expect(tokensReceived('test')).toStrictEqual(
      { type: 'TOKENS_RECEIVED', payload: 'test' },
    );
  });

  it('logOut test', () => {
    expect(logOut()).toStrictEqual(
      { type: 'LOGOUT' },
    );
  });

  it('revisionSelected test', () => {
    expect(revisionSelected('test')).toStrictEqual(
      { type: 'REVISION_SELECTED', payload: 'test' },
    );
  });

  it('documentationSelected test', () => {
    expect(documentationSelected('test')).toStrictEqual(
      { type: 'DOCUMENTATION_SELECTED', payload: 'test' },
    );
  });

  it('documentationEmpty test', () => {
    expect(documentationEmpty()).toStrictEqual(
      { type: 'DOCUMENTATION_EMPTY' },
    );
  });

  it('pageAutosave test', () => {
    expect(pageAutosave(1, 'test', 'content')).toStrictEqual(
      { type: 'PAGE_AUTOSAVE', payload: { docuId: 1, page: 'test', content: 'content' } },
    );
  });

  it('pageAutosaveRemove test', () => {
    expect(pageAutosaveRemove(1, 'test')).toStrictEqual(
      { type: 'PAGE_AUTOSAVE_REMOVE', payload: { docuId: 1, page: 'test' } },
    );
  });

  it('updateChangesList test', () => {
    expect(updateChangesList('test')).toStrictEqual(
      { type: 'CHANGES_UPDATE', payload: 'test' },
    );
  });

  it('excludeChange test', () => {
    expect(excludeChange('test')).toStrictEqual(
      { type: 'CHANGE_EXCLUDE', payload: 'test' },
    );
  });

  it('includeChange test', () => {
    expect(includeChange('test')).toStrictEqual(
      { type: 'CHANGE_INCLUDE', payload: 'test' },
    );
  });
});
