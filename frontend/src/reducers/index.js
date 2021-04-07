import {
  LOGIN,
  LOGOUT,
  REVISION_SELECTED,
  DOCUMENTATION_SELECTED,
  DOCUMENTATION_LIST_UPDATE,
  DOCUMENTATION_EMPTY,
  CHANGES_UPDATE,
  TOKENS_RECEIVED,
} from '../constants/action-types';

const initialState = {
  loggedIn: false,
  userData: null,
  docuList: [],
};

function rootReducer(state = initialState, action) {
  const { payload } = action;
  if (action.type === LOGIN) {
    return {
      ...state,
      loggedIn: true,
      userData: payload,
    };
  }

  if (action.type === LOGOUT) {
    return {
      loggedIn: false,
    };
  }

  if (action.type === REVISION_SELECTED) {
    if (payload.from) {
      return { ...state, startRevision: payload.revisionData };
    }
    return { ...state, endRevision: payload.revisionData };
  }

  if (action.type === DOCUMENTATION_SELECTED) {
    if (state.docuId !== payload) {
      return {
        ...state,
        docuId: payload,
        startRevision: null,
        endRevision: null,
        docuEmpty: false,
      };
    }
  }

  if (action.type === DOCUMENTATION_LIST_UPDATE) {
    return {
      ...state,
      docuList: payload,
    };
  }

  if (action.type === DOCUMENTATION_EMPTY) {
    return {
      ...state,
      docuEmpty: true,
    };
  }

  if (action.type === CHANGES_UPDATE) {
    return {
      ...state,
      changes: payload,
    };
  }

  if (action.type === TOKENS_RECEIVED) {
    return { ...state, ...payload };
  }

  return state;
}

export default rootReducer;
