import { LOGIN, LOGOUT, REVISION_SELECTED, DOCUMENTATION_SELECTED } from "../constants/action-types";
import { persistor } from "../store";

const initialState = {
  loggedIn: false,
  userData: null
};


function rootReducer(state = initialState, action) {
  const payload = action.payload;
  if (action.type === LOGIN) {
    return Object.assign({}, state, {
      loggedIn: true,
      userData: payload
    });
  } else if (action.type === LOGOUT) {
    return {
      loggedIn: false,
    };
  }else if (action.type === REVISION_SELECTED) {
    if (payload.from){
      return Object.assign({}, state, {
        startRevision: payload.revisionData
      });
    }else{
      return Object.assign({}, state, {
        endRevision: payload.revisionData
      });
    }
  }else if (action.type === DOCUMENTATION_SELECTED) {
    return Object.assign({}, state, {
      docuId: payload,
      startRevision: null,
      endRevision: null
    });
  }

  return state;
}

export default rootReducer;