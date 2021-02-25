import { LOGIN, LOGOUT } from "../constants/action-types";

const initialState = {
  loggedIn: false,
  userData: null
};


function rootReducer(state = initialState, action) {
  if (action.type === LOGIN) {
    return Object.assign({}, state, {
      loggedIn: true,
      userData: action.payload
    });
  } else if (action.type === LOGOUT) {
    return Object.assign({}, state, {
      loggedIn: false,
      userData: null
    });
  }
  
  return state;
}

export default rootReducer;