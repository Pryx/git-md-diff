import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import CommitSelect from './CommitSelect';
import DiffOverview from './DiffOverview';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DiffPage extends React.Component {
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
    const {
      commitTo, commitFrom, selectedRepo, repos, error, cloneUrl,
    } = this.state;

    const to = commitTo.commit || commitTo.branch;
    const from = commitFrom.commit || commitFrom.branch;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    } 
    
    if (!selectedRepo) {
      return (
        <Container className="mt-5">
          <Row className="select-diff">
            <Col lg={6} xs={12}>
              Select repository:
              <Form.Control as="select" onChange={this.handleRepoChange} value={selectedRepo}>
                <option key="" value="">
                  Select a repo
                </option>
                {
                  repos.map(
                    (repo) => (
                      <option key={repo} value={repo}>
                        {repo}
                      </option>
                    ),
                  )
                }
                ;
              </Form.Control>
            </Col>
            <Col lg={6} xs={12}>
              Or clone a new one:
              <InputGroup className="mb-3">
                <FormControl onChange={this.handleCloneUrl} value={cloneUrl} />
                <InputGroup.Append>
                  <Button onClick={this.handleClone}>
                    Clone!
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container className="mt-5">
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            Select repository:
            <Form.Control as="select" onChange={this.handleRepoChange} value={selectedRepo}>
              <option key="" value="">
                Select a repo
                </option>
              {
                  repos.map(
                    (repo) => (
                      <option key={repo} value={repo}>
                        {repo}
                      </option>
                    ),
                  )
                }
              ;
            </Form.Control>
          </Col>
          <Col lg={6} xs={12}>
            Or clone a new one:
            <InputGroup className="mb-3">
              <FormControl onChange={this.handleCloneUrl} value={cloneUrl} />
              <InputGroup.Append>
                <Button onClick={this.handleClone}>
                    Clone!
                  </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            Select from
            <CommitSelect id="from" dependsOn="to" comparison="<" update={this.updateFrom} repo={selectedRepo} />
          </Col>
          <Col lg={6} xs={12}>
            Select to
            <CommitSelect id="to" dependsOn="from" comparison=">" update={this.updateTo} repo={selectedRepo} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <DiffOverview from={from} to={to} repo={selectedRepo} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default hot(module)(DiffPage);
