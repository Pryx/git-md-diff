import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import { Switch, Route, Redirect } from 'wouter';
import DiffPage from './DiffPage';
import EditPage from './EditPage';
import Login from './Login'
import { connect } from "react-redux";

/**
 * The root app element. Takes care of routing and right now
 * it stores the app state. This should be changed when Redux
 * is implemented. 
 */
class App extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      commitFrom: { branch: '', commit: '' },
      commitTo: { branch: '', commit: '' },
      selectedDocumentation: null,
      repos: [],
      error: null,
      cloneUrl: '',
    };
  }

  updateFrom = (from) => {
    this.setState({
      commitFrom: from,
    });
  };

  updateTo = (to) => {
    this.setState({
      commitTo: to,
    });
  };

  //TODO: We should fail gracefully, so that the user isn't left with a broken page
  componentDidMount() {
    fetch('/api/documentations')
      .then((r) => r.json())
      .then(
        (documentations) => {
          this.setState({
            repos: documentations,
          });
        },

        (error) => {
          this.setState({
            error,
          });
        },
      );
  }


  render() {
    if (this.props.loggedIn) {
      return (
        <Switch>
          <Route path="/edit/:repo/:file" >
            {(params) => <EditPage repo={params.repo} file={params.file} />}
          </Route>

          <Route path="/logout">
            <Login logout={true} />
          </Route>

          <Route path="/">
            <DiffPage />
          </Route>

          <Redirect to="/"></Redirect>

        </Switch>
      );
    } else {
      return (
        <Switch>
          <Route path="/login/error" >
            <Login error={true} />
          </Route>

          <Route path="/login/success" >
            <Login success={true} />
          </Route>

          <Route path="/logout">
            <Login logout={true} />
          </Route>

          <Route path="/login">
            <Login />
          </Route>

          <Redirect to="/login" />
        </Switch>
      );
    }
  }
}

const mapStateToProps = state => {
  return { loggedIn: state.loggedIn };
};

export default hot(module)(connect(mapStateToProps)(App));
