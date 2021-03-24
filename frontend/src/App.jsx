import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/js/all.js';
import { Switch, Route, Redirect } from 'wouter';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DiffPage from './components/DiffWrapper';
import EditPage from './pages/EditPage';
import Login from './pages/LoginPage';
import 'remark-admonitions/styles/classic.css';
import Dashboard from './pages/Dashboard';
import NewDocumentation from './pages/NewDocumentation';
import DocumentationPage from './pages/DocumentationPage';
import { hotjar } from 'react-hotjar';

/**
 * The root app element. Takes care of routing and right now
 * it stores the app state. This should be changed when Redux
 * is implemented.
 */
const App = (props) => {
  hotjar.initialize(2314358, 6);

  const { loggedIn } = props;
  if (loggedIn) {
    return (
      <Switch>
        <Route path="/documentation/:docuId/edit/:file">
          {(params) => <EditPage docuId={params.docuId} file={params.file} />}
        </Route>

        <Route path="/logout">
          <Login logout />
        </Route>

        <Route path="/documentation/new">
          <NewDocumentation />
        </Route>

        <Route path="/documentation/:docuId">
          {(params) => <DocumentationPage docuId={params.docuId} />}
        </Route>

        <Route path="/">
          <Dashboard />
        </Route>

        <Redirect to="/" />
      </Switch>
    );
  }
  return (
    <Switch>
      <Route path="/login/error">
        <Login error />
      </Route>

      <Route path="/login/success">
        <Login success />
      </Route>

      <Route path="/logout">
        <Login logout />
      </Route>

      <Route path="/login">
        <Login />
      </Route>

      <Redirect to="/login" />
    </Switch>
  );
};

const mapStateToProps = (state) => ({ loggedIn: state.loggedIn });
App.propTypes = {
  loggedIn: PropTypes.bool.isRequired,
};
export default hot(module)(connect(mapStateToProps)(App));
