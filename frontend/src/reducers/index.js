import lodash from 'lodash';
import {
  LOGIN,
  LOGOUT,
  REVISION_SELECTED,
  DOCUMENTATION_SELECTED,
  DOCUMENTATION_LIST_UPDATE,
  DOCUMENTATION_EMPTY,
  CHANGES_UPDATE,
  TOKENS_RECEIVED,
  PAGE_AUTOSAVE,
  PAGE_AUTOSAVE_REMOVE,
  CHANGE_INCLUDE,
  CHANGE_EXCLUDE,
} from '../constants/action-types';

const initialState = {
  userData: null,
  docuList: [],
  autosaved: {},
  excludedChanges: [],
};

function rootReducer(state = initialState, action) {
  const { payload } = action;

  if (action.type === LOGIN) {
    return {
      ...state,
      userData: payload,
    };
  }

  if (action.type === LOGOUT) {
    return {};
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

  if (action.type === CHANGE_INCLUDE) {
    const { excludedChanges } = state;

    lodash.remove(excludedChanges, (e) => e === payload);

    return {
      ...state,
      excludedChanges: [...excludedChanges],
    };
  }

  if (action.type === CHANGE_EXCLUDE) {
    const { excludedChanges } = state;
    return {
      ...state,
      excludedChanges: [...excludedChanges, payload],
    };
  }

  if (action.type === PAGE_AUTOSAVE) {
    const { autosaved } = state;
    const { docuId, page, content } = payload;
    if (!autosaved[docuId]) {
      autosaved[docuId] = {};
    }

    if (!autosaved[docuId][page]) {
      autosaved[docuId][page] = {};
    }

    autosaved[docuId][page].date = new Date();
    autosaved[docuId][page].content = content;
    return { ...state, autosaved: { ...autosaved } };
  }

  if (action.type === PAGE_AUTOSAVE_REMOVE) {
    const { autosaved } = state;
    const { docuId, page } = payload;

    if (autosaved[docuId] && autosaved[docuId][page]) {
      delete autosaved[docuId][page];
    }

    return { ...state, autosaved: { ...autosaved } };
  }

  if (action.type === TOKENS_RECEIVED) {
    return { ...state, ...payload };
  }

  return state;
}

export default rootReducer;
