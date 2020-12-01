import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import PropTypes from 'prop-types';
import DiffView from './DiffView';

class DiffOverview extends React.Component {
  state = {
    changes: [],
    before: [],
    after: [],
  };

  from = null;

  to = null;

  repo = null;

  constructor(props) {
    super(props);
    this.from = props.from;
    this.to = props.to;
    this.repo = props.repo;
    this.state = {
      changes: [],
      isLoaded: false,
      ready: false,
    };
  }

  componentWillReceiveProps(props) {
    this.from = props.from;
    this.to = props.to;
    // You don't have to do this check first, but it can help prevent an unneeded render
    this.setState({
      ready: false,
    });
    if (this.from && this.to) {
      this.setState({
        ready: true,
        isLoaded: false,
      });
      fetch(`http://localhost:3000/${this.repo}/list-changes/${this.from}/${this.to}`)
        .then((r) => r.json())
        .then(
          (changes) => {
            this.setState({
              isLoaded: true,
              changes,
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
  }

  componentDidMount() {

  }

  render() {
    const {
      error, isLoaded, changes, ready,
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

    if (!ready) {
      return (
        <div>
          Please select revisions
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

    if (changes.length == 0){
      return (
          <Row className="mt-4">
            <Col>
              No changes in Markdown files for the selected revision range
            </Col>
          </Row>
      );
    }

    return (
      changes.map(
        (change) => (
          <Row key={change.file} className="mt-4">
            <Col>
              <DiffView file={change.file} insertions={change.insertions} deletions={change.deletions} from={this.from} to={this.to} repo={this.repo} />
            </Col>
          </Row>
        ),
      )
    );
  }
}

DiffOverview.defaultProps = {
  from: null,
  to: null,
};

DiffOverview.propTypes = {
  from: PropTypes.string,
  to: PropTypes.string,
  repo: PropTypes.string.isRequired,
};

export default hot(module)(DiffOverview);
