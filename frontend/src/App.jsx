import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import { Switch, Route, Redirect } from 'wouter';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DiffPage from './DiffPage';
import EditPage from './EditPage';
import Login from './Login';
import 'remark-admonitions/styles/classic.css';

/**
 * The root app element. Takes care of routing and right now
 * it stores the app state. This should be changed when Redux
 * is implemented.
 */
const App = (props) => {
  const { loggedIn } = props;
  if (loggedIn) {
    return (
      <Switch>
        <Route path="/edit/:docu/:file">
          {(params) => <EditPage docuId={params.docu} file={params.file} />}
        </Route>

        <Route path="/logout">
          <Login logout />
        </Route>

        <Route path="/">
          <DiffPage />
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
