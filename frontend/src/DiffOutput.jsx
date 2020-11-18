import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Diff from './diff/diff';

class CommitSelect extends React.Component {
  state = {
    changes: [],
    before: [],
    after: [],
  };

  from = null;

  to = null;

  constructor(props) {
    super(props);
    this.from = props.from;
    this.to = props.to;
    this.state = {
      before: [],
      after: [],
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
      fetch(`http://localhost:3000/list-changes/${this.from}/${this.to}`)
        .then((r) => r.json())
        .then(
          (changes) => {
            this.setState({
              changes,
            });

            const before = [];
            const after = [];
            const fetches = [];
            changes.forEach((change) => {
              const b = fetch(`http://localhost:3000/file/${encodeURIComponent(change.file)}/${this.from}`)
                .then((r) => r.json())
                .then((file) => {
                  before[change.file] = file.content;
                });

              fetches.push(b);

              const a = fetch(`http://localhost:3000/file/${encodeURIComponent(change.file)}/${this.to}`)
                .then((r) => r.json())
                .then((file) => {
                  after[change.file] = file.content;
                });

              fetches.push(a);
            });

            Promise.all(fetches).then(() => {
              this.setState({
                before,
                after,
                isLoaded: true,
              });
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
      error, isLoaded, before, after, changes, ready,
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

    return (
      changes.map(
        (change) => (
          <Form.Row key="{change.file}" className="mt-2">
            <Col>
              <Card>
                <Card.Header>
                  {change.file}
                </Card.Header>
                <Card.Body
                  dangerouslySetInnerHTML={
                    {
                      __html: Diff(before[change.file], after[change.file]),
                    }
                }
                />
              </Card>
            </Col>
          </Form.Row>
        ),
      )
    );
  }
}

CommitSelect.defaultProps = {
  from: null,
  to: null,
};

CommitSelect.propTypes = {
  from: PropTypes.string,
  to: PropTypes.string,
};

export default hot(module)(CommitSelect);
