import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Router } from 'wouter';
import App from './App';
import Navigation from './components/app/Navigation';
import { useLocationWithConfirmation } from './helpers/prevent-nav';
import { persistor, store } from './store';

/**
 * The main app wrapper.
 */
render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Router hook={useLocationWithConfirmation}>
        <Navigation />
        <App />
      </Router>
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);
