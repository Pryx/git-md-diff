import { hot } from 'react-hot-loader';
import React from 'react';
import PropTypes from 'prop-types';
import Diff from '../diff/diff';
import { Badge } from 'react-bootstrap';

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

    console.error(from, to, docuId, file)
    fetch(`/api/documentations/${docuId}/${from}/pages/${encodeURIComponent(file)}`)
      .then((r) => r.json())
      .then(
        (original) => {
          fetch(`/api/documentations/${docuId}/${to}/pages/${encodeURIComponent(file)}`)
            .then((r) => r.json())
            .then(
              (modified) => {
                const contentPromise = new Promise((resolve, reject) => {
                  let content = Diff({ docuId, from, to }, original.data, modified.data, this.options)
                  resolve(content)
                });

                contentPromise.then((content) => this.setState(
                  {
                    isLoaded: true,
                    content
                  }
                )
                )
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

    let badges = null;
    if (content.invisible.length){
      badges = content.invisible.map((change) => ( 
        <Badge variant={change.variant} key={change.id}>{change.text}</Badge>
      )  
      );
    }

    return (
      <div>
        <div className="editor-diff-content" dangerouslySetInnerHTML={{ __html: content.content }} />
        <hr />
        <div>
          {badges}
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