import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import { Switch, Route, Redirect } from 'wouter';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import smartlookClient from 'smartlook-client';
import EditPage from './pages/EditPage';
import 'remark-admonitions/styles/classic.css';
import Dashboard from './pages/Dashboard';
import NewDocumentation from './pages/NewDocumentation';
import DocumentationPage from './pages/DocumentationPage';
import DocumentationSettings from './pages/DocumentationSettings';
import UserProfile from './pages/UserProfile';
import Login from './components/app/Login';
import LoginPage from './pages/LoginPage';
import { refreshTokens } from './helpers/secure-ky';
import User from './shapes/user';
import ProofreadingPage from './pages/ProofreadingPage';
import ProofreadingEditPage from './pages/ProofreadingEditPage';

// Initialize smartlook
smartlookClient.init(window.env.api.smartlook);

// Token checking. Should probably be moved to a webworker
let check = false;
setInterval(async () => {
  if (!check) {
    return;
  }

  refreshTokens();
}, 30000);

/**
 * The APP components handles all the routing and renders the correct page
 * @param {*} props The react props
 * @returns the react component
 */
const App = (props) => {
  const { userData } = props;
  if (userData) {
    check = true;
    refreshTokens();
    return (
      <Switch>
        <Route path="/documentation/:docuId/proofreading/:reqId/v/:version/r/:from/:to/f/:file+">
          {(params) => (
            <ProofreadingEditPage
              docuId={parseInt(params.docuId, 10)}
              reqId={parseInt(params.reqId, 10)}
              version={params.version}
              from={params.from}
              to={params.to}
              file={params.file}
            />
          )}
        </Route>

        <Route path="/documentation/:docuId/proofreading/:reqId">
          {(params) => (
            <ProofreadingPage
              reqId={parseInt(params.reqId, 10)}
              docuId={parseInt(params.docuId, 10)}
            />
          )}
        </Route>

        <Route path="/documentation/:docuId/edit/v/:version/f/:file+">
          {(params) => (
            <EditPage
              docuId={parseInt(params.docuId, 10)}
              version={params.version}
              to={params.version}
              file={params.file}
            />
          )}
        </Route>

        <Route path="/documentation/:docuId/edit/v/:version/r/:from/:to/f/:file+">
          {(params) => (
            <EditPage
              docuId={parseInt(params.docuId, 10)}
              version={params.version}
              from={params.from}
              to={params.to}
              file={params.file}
            />
          )}
        </Route>

        <Route path="/logout">
          <LoginPage logout />
        </Route>

        <Route path="/documentation/new">
          <NewDocumentation />
        </Route>

        <Route path="/profile">
          <UserProfile />
        </Route>

        <Route path="/profile/:id">
          {(params) => <UserProfile id={params.id} />}
        </Route>

        <Route path="/documentation/:docuId/settings">
          {(params) => <DocumentationSettings docuId={parseInt(params.docuId, 10)} />}
        </Route>

        <Route path="/documentation/:docuId">
          {(params) => <DocumentationPage docuId={parseInt(params.docuId, 10)} />}
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
        <LoginPage loginError />
      </Route>

      <Route path="/login/success/:token/:refreshToken">
        {(params) => <Login token={params.token} refreshToken={params.refreshToken} />}
      </Route>

      <Route path="/logout">
        <LoginPage logout />
      </Route>

      <Route path="/login">
        <LoginPage />
      </Route>

      <Redirect to="/login" />
    </Switch>
  );
};

const mapStateToProps = (state) => ({ userData: state.userData });

App.defaultProps = {
  userData: null,
};

App.propTypes = {
  userData: PropTypes.shape(User),
};
export default hot(module)(connect(mapStateToProps)(App));
