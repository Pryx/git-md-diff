import React from 'react';
import { render } from 'react-dom';
import App from './App';
import Navigation from './Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

render(
  <>
    <Navigation />
    <App />
  </>,
  document.getElementById('root'),
);
