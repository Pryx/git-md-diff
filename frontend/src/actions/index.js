export function logIn(payload) {
  return { type: 'LOGIN', payload };
}

export function tokensReceived(payload) {
  return { type: 'TOKENS_RECEIVED', payload };
}

export function logOut() {
  return { type: 'LOGOUT' };
}

export function revisionSelected(payload) {
  return { type: 'REVISION_SELECTED', payload };
}

export function documentationSelected(payload) {
  return { type: 'DOCUMENTATION_SELECTED', payload };
}

export function documentationEmpty() {
  return { type: 'DOCUMENTATION_EMPTY', payload: null };
}

export function pageAutosave(docuId, page, content) {
  return { type: 'PAGE_AUTOSAVE', payload: { docuId, page, content } };
}

export function pageAutosaveRemove(docuId, page) {
  return { type: 'PAGE_AUTOSAVE_REMOVE', payload: { docuId, page } };
}

export function updateChangesList(payload) {
  return { type: 'CHANGES_UPDATE', payload };
}

export function excludeChange(payload) {
  return { type: 'CHANGE_EXCLUDE', payload };
}

export function includeChange(payload) {
  return { type: 'CHANGE_INCLUDE', payload };
}
