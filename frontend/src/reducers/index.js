import {
  LOGIN, LOGOUT, REVISION_SELECTED, DOCUMENTATION_SELECTED,
} from '../constants/action-types';

const initialState = {
  loggedIn: false,
  userData: null,
};

function rootReducer(state = initialState, action) {
  const { payload } = action;
  if (action.type === LOGIN) {
    return {
      ...state,
      loggedIn: true,
      userData: payload,
    };
  } if (action.type === LOGOUT) {
    return {
      loggedIn: false,
    };
  } if (action.type === REVISION_SELECTED) {
    if (payload.from) {
      return { ...state, startRevision: payload.revisionData };
    }
    return { ...state, endRevision: payload.revisionData };
  } if (action.type === DOCUMENTATION_SELECTED) {
    return {
      ...state,
      docuId: payload,
      startRevision: null,
      endRevision: null,
    };
  }

  return state;
}

export default rootReducer;
