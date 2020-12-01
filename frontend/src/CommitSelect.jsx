import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import PropTypes from 'prop-types';

class CommitSelect extends React.Component {
  state = {
    error: null,
    isLoaded: false,
    branches: [],
    commits: [],
  };

  dependsOn = null;

  comparison = null;

  update = null;

  repo = null;

  constructor(props) {
    super(props);
    this.dependsOn = props.dependsOn;
    this.comparison = props.comparison;
    this.handleBranch = this.handleBranch.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
    this.update = props.update;
    this.repo = props.repo;

    this.state = {
      isLoaded: false,
      branches: [],
      commits: [],
      currentBranch: '',
      currentCommit: '',
    };
  }

  componentDidMount() {
    fetch(`http://localhost:3000/${this.repo}/get-branches`)
      .then((r) => r.json())
      .then(
        (branches) => {
          const cb = branches.all.includes('master') ? 'master' : branches.all[0];
          this.setState({
            branches: branches.all,
            currentBranch: cb,
            commits: [],
            currentCommit: '',
          });

          fetch(`http://localhost:3000/${this.repo}/get-commits/${cb}`)
            .then((r) => r.json())
            .then((commits) => {
              this.update({
                branch: cb,
                commit: commits.all[0].hash,
              });

              this.setState(
                {
                  isLoaded: true,
                  commits: commits.all,
                  currentCommit: commits.all[0].hash,
                },
              );
            });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        },
      );
  }

  handleBranch(e) {
    this.update({
      branch: e.currentTarget.value,
      commit: '',
    });

    this.setState(
      {
        isLoaded: false,
        currentBranch: e.currentTarget.value,
      },
    );

    fetch(`http://localhost:3000/${this.repo}/get-commits/${encodeURIComponent(e.currentTarget.value)}`)
      .then((r) => r.json())
      .then((commits) => {
        this.setState(
          {
            isLoaded: true,
            commits: commits.all,
          },
        );
      });
  }

  handleCommit(e) {
    const { currentBranch } = this.state;
    this.update({
      branch: currentBranch,
      commit: e.currentTarget.value,
    });
    this.setState(() => (
      {
        currentCommit: e.currentTarget.value,
      }));
  }

  render() {
    const {
      error, isLoaded, branches, commits, currentBranch, currentCommit,
    } = this.state;

    if (error) {
      return (
        <div>
          Error:
          {' '}
          {error.message}
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    return (
      <Form.Row>
        <Col>
          <Form.Control as="select" value={currentBranch} onChange={this.handleBranch}>
            {
              branches.map(
                (branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ),
              )
            }
            ;
          </Form.Control>
        </Col>
        <Col>
          <Form.Control as="select" value={currentCommit} onChange={this.handleCommit}>
            {
              commits.map(
                (commit) => (
                  <option key={commit.hash} value={commit.hash}>
                    {commit.hash}
                  </option>
                ),
              )
            }
            ;
          </Form.Control>
        </Col>
      </Form.Row>
    );
  }
}

CommitSelect.defaultProps = {
  dependsOn: null,
  comparison: null,
};

CommitSelect.propTypes = {
  dependsOn: PropTypes.string,
  comparison: PropTypes.string,
  update: PropTypes.func.isRequired,
  repo: PropTypes.string.isRequired,
};

export default hot(module)(CommitSelect);
