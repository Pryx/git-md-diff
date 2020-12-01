import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import {Link} from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Diff from './diff/diff.js';

class DiffViewEditor extends React.Component {
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

    this.link = `/edit/${this.from}/${this.to}/${this.file}`
    
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
      <div>
        <div>Error: {error.message}.</div>
        <div>
          Invisible changes: Loading...
        </div>
      </div>
      );
    }

    if (!isLoaded) {
      return (
        <div>
          <div>Loading...</div>
          <div>
            Invisible changes: Loading...
          </div>
        </div>
      );
    }

    return (
      <div>
        < div dangerouslySetInnerHTML={{ __html: content.content }} />
        <hr />
        <div>
          Invisible changes: {content.invisible.join(', ')}
        </div>
      </div>
    );
  }
}

DiffViewEditor.defaultProps = {
  hideCode: false
};

DiffViewEditor.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  insertions: PropTypes.number.isRequired,
  deletions: PropTypes.number.isRequired,
  hideCode: PropTypes.boolean,
};

export default hot(module)(DiffViewEditor);
