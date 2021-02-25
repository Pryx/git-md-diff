export function logIn(payload) {
  console.log("Dispatched login, payload:", payload)
  return { type: "LOGIN", payload }
};

export function logOut() {
  return { type: "LOGOUT" }
};