import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import rootReducer from '../reducers';

// Persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['userData', 'autosaved', 'token', 'refreshToken'],
};

// Create store & reducer + persist them
const persistedReducer = persistReducer(persistConfig, rootReducer);
export const store = createStore(persistedReducer);
export const persistor = persistStore(store);
