import { hot } from 'react-hot-loader';
import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'markdown-to-jsx';
import Diff from './diff/diff';

import './App.css';

/**
 * A slightly modified DiffView for display in the editor file.
 */
// TODO: This should probably be rewritten so that it can use same components as the DiffView.
class DiffViewEditor extends React.Component {
  state = {
    isLoaded: false,
    content: '',
  };

  constructor(props) {
    super(props);
    this.options = { hideCode: props.hideCode, returnMdx: true };
  }

  componentDidMount() {
    const {
      docuId, from, file, to,
    } = this.props;
    fetch(`/api/documentations/${docuId}/${from}/pages/${encodeURIComponent(file)}`)
      .then((r) => r.json())
      .then(
        (original) => {
          fetch(`/api/documentations/${docuId}/${to}/pages/${encodeURIComponent(file)}`)
            .then((r) => r.json())
            .then(
              (modified) => {
                this.setState({
                  isLoaded: true,
                  content: Diff(
                    {
                      docuId,
                      from,
                      to,
                    },
                    original.content,
                    modified.content,
                    this.options,
                  ),
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
      error, isLoaded, content,
    } = this.state;

    if (error) {
      return (
        <div>
          <div>
            Error:
            {error.message}
            .
          </div>
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
        <Markdown>{content.content}</Markdown>
        <hr />
        <div>
          Invisible changes:
          {' '}
          {content.invisible.join(', ')}
        </div>
      </div>
    );
  }
}

DiffViewEditor.defaultProps = {
  hideCode: false,
};

DiffViewEditor.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  docuId: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  hideCode: PropTypes.bool,
};

export default hot(module)(DiffViewEditor);
