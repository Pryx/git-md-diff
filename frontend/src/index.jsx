import React from 'react';
import { render } from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/index';

import App from './App';
import Navigation from './Navigation';

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Navigation />
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);
