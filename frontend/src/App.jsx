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
      selectedRepo: null,
      repos: [],
      error: null,
      cloneUrl: '',
    };

    this.handleClone = this.handleClone.bind(this);
    this.handleCloneUrl = this.handleCloneUrl.bind(this);
    this.handleRepoChange = this.handleRepoChange.bind(this);
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

  handleClone(e) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: this.state.cloneUrl }),
    };
    fetch('http://localhost:3000/clone', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const { repos } = this.state;
          repos.push(data.name);
          this.setState({ repos, cloneUrl: '' });
        } else {
          this.setState({ error: "Couldn't clone repository!" });
        }
      });
  }

  //TODO: We should fail gracefully, so that the user isn't left with a broken page
  componentDidMount() {
    fetch('http://localhost:3000/list-repos')
      .then((r) => r.json())
      .then(
        (repository) => {
          this.setState({
            repos: repository,
            selectedRepo: repository[0],
          });
        },

        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  handleCloneUrl(e) {
    this.setState(
      {
        cloneUrl: e.currentTarget.value,
      },
    );
  }

  handleRepoChange(e) {
    this.setState(
      {
        selectedRepo: e.currentTarget.value,
      },
    );
  }

  render() {
    if (this.props.loggedIn) {
      return (
        <Switch>
          <Route path="/edit/:repo/:from/:to/:file" >
            {(params) => <EditPage repo={params.repo} from={params.from} to={params.to} file={params.file} />}
          </Route>

          <Route path="/">
            <DiffPage />
          </Route>

          <Route path="/logout">
            <Login logout={true} />
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
