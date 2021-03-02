export function logIn(payload) {
  return { type: "LOGIN", payload }
};

export function logOut() {
  return { type: "LOGOUT" }
};

export function revisionSelected(payload) {
  return { type: "REVISION_SELECTED", payload }
};

export function documentationSelected(payload) {
  return { type: "DOCUMENTATION_SELECTED", payload }
};