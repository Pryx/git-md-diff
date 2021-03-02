import { hot } from 'react-hot-loader';
import React from 'react';
import {Link} from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Diff from './diff/diff.js';

/**
 * Diff view shows the diff file contents. Currently this
 * even handles the file diffing itself, this should
 * probably be offloaded to the server.
 */
class DiffView extends React.Component {
  from = null;

  to = null;

  repo = null;

  file = null;

  insertions = null;

  deletions = null;
  
  link = null;

  constructor(props) {
    super(props);
    this.from = props.from;
    this.to = props.to;
    this.repo = props.repo;
    this.file = props.file;
    this.insertions = props.insertions;
    this.deletions = props.deletions;
    this.options = {hideCode: props.hideCode};

    this.link = `/edit/${this.repo}/${this.from}/${this.to}/${encodeURIComponent(this.file).replace('.', '%2E')}`
    
    this.state = {
      isLoaded: false,
      content: '',
    };
  }

  componentDidMount() {
    fetch(`http://localhost:3000/${this.repo}/file/${encodeURIComponent(this.file)}/${this.from}`)
      .then((r) => r.json())
      .then(
        (original) => {
          fetch(`http://localhost:3000/${this.repo}/file/${encodeURIComponent(this.file)}/${this.to}`)
            .then((r) => r.json())
            .then(
              (modified) => {
                this.setState({
                  isLoaded: true,
                  content: Diff({ repo: this.repo, from: this.from, to: this.to }, original.content, modified.content, this.options),
                });
              },
              (error) => {
                this.setState({
                  isLoaded: true,
                  error,
                });
              },
            );
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        },
      );
  }

  render() {
    const {
      error, isLoaded, changes, content,
    } = this.state;

    if (error) {
      return (
        <Card>
          <Card.Header>
            <a className="title">{this.file}</a>
            <span className="changes float-right">
              Changes:
              <span className="additions">
                +
                {this.insertions}
              </span>
              {' '}
              <span className="deletions">
                -
                {this.deletions}
              </span>
            </span>
          </Card.Header>
          <Card.Body>
            Error:
            {' '}
            {error.message}
          </Card.Body>
          <Card.Footer>
            Invisible changes: N/A
          </Card.Footer>
        </Card>
      );
    }

    if (!isLoaded) {
      return (
        <Card>
          <Card.Header>
            <a className="title">{this.file}</a>
            <span className="changes float-right">
              Changes:
              <span className="additions">
                +
                {this.insertions}
              </span>
              {' '}
              <span className="deletions">
                -
                {this.deletions}
              </span>
            </span>
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
          <Card.Footer>
            Invisible changes: Loading...
          </Card.Footer>
        </Card>
      );
    }

    return (
      <Card>
        <Card.Header>
          <Link href={this.link}>
          <a className="title">{this.file}</a>
          </Link>
          
          <span className="changes float-right">
            Changes:
            <span className="additions">
              +
              {this.insertions}
            </span>
            {' '}
            <span className="deletions">
              -
              {this.deletions}
            </span>
          </span>
        </Card.Header>
        <Card.Body dangerouslySetInnerHTML={{ __html: content.content }} />
        <Card.Footer>
          Invisible changes:
          {' '}
          {content.invisible.join(', ')}
        </Card.Footer>
      </Card>
    );
  }
}

DiffView.defaultProps = {
  hideCode: true
};

DiffView.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  insertions: PropTypes.number.isRequired,
  deletions: PropTypes.number.isRequired,
  hideCode: PropTypes.boolean,
};

export default hot(module)(DiffView);
