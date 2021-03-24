export function logIn(payload) {
  return { type: 'LOGIN', payload };
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

export function updateDocumentationList(payload) {
  return { type: 'DOCUMENTATION_LIST_UPDATE', payload };
}

export function documentationEmpty() {
  return { type: 'DOCUMENTATION_EMPTY', payload: null };
}

export function updateChangesList(payload) {
  return { type: 'CHANGES_UPDATE', payload };
}