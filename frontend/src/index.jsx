import React from 'react';
import { render } from 'react-dom';
import App from './App';
import Navigation from './Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Provider } from 'react-redux'
import {store, persistor} from './store/index'
import { PersistGate } from 'redux-persist/integration/react'

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Navigation />
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);
