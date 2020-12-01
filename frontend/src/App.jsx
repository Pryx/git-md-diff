import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import { Switch, Route } from 'wouter';
import DiffPage from './DiffPage';
import EditPage from './EditPage';

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
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
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
    return (
      <Switch>
        <Route path="/edit/:repo/:from/:to/:file" >
          {(params) =><EditPage repo={params.repo} from={params.from} to={params.to} file={params.file} /> }
        </Route>
        <Route>
          <DiffPage />
        </Route>
      </Switch>
    );
  }
}

export default hot(module)(App);
