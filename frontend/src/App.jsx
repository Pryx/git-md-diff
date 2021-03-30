import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/js/all.js';
import { Switch, Route, Redirect } from 'wouter';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import EditPage from './pages/EditPage';
import Login from './pages/LoginPage';
import 'remark-admonitions/styles/classic.css';
import Dashboard from './pages/Dashboard';
import NewDocumentation from './pages/NewDocumentation';
import DocumentationPage from './pages/DocumentationPage';
import smartlookClient from 'smartlook-client'
import DocumentationSettings from './pages/DocumentationSettings';
import UserProfile from './pages/UserProfile';
import { store } from './store';
import { logOut } from './actions';
import ky from 'ky';

smartlookClient.init('96987d432f762d1afd5dff3e5ec07f38ac5924fa');

/**
 * The root app element. Takes care of routing and right now
 * it stores the app state. This should be changed when Redux
 * is implemented.
 */
let check = false;
setInterval(async () => {
  if (!check){
    return;
  }

  try {
    const json = await ky(`/api/users/current`).json();
  } catch (error) {
    if (error.response && error.response.status == 403){
      store.dispatch(logOut())
    }else {
      console.error(error);
    }
  }
}, 30000);

const App = (props) => {
  const { loggedIn } = props;
  if (loggedIn) {
    check = true;
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

        <Route path="/profile">
          <UserProfile />
        </Route>

        <Route path="/profile/:id">
        {(params) => <UserProfile id={params.id} /> }
        </Route>

        <Route path="/documentation/:docuId/settings">
          {(params) => <DocumentationSettings docuId={params.docuId} />}
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

  check = false;
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
