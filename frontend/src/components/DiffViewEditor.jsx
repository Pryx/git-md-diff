import { hot } from 'react-hot-loader';
import React from 'react';
import PropTypes from 'prop-types';
import Diff from '../diff/diff';
import { Badge } from 'react-bootstrap';
import ky from 'ky';
import { connect } from 'react-redux';
import { store } from '../store';
import { logOut } from '../actions';

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
      docuId, from, to, changes, file
    } = this.props;

    if (!changes.length){
      this.setState(
        {
          isLoaded: true,
          error: "Couldn't load change data"
        }
      );
      return;
    }

    const { oldFile, newFile } = changes.find((v) => v.newFile == file);

    const fetchDiff = async () => {
      const original = await ky(`/api/documentations/${docuId}/${from}/pages/${encodeURIComponent(oldFile)}`).json();
      const modified = await ky(`/api/documentations/${docuId}/${to}/pages/${encodeURIComponent(newFile)}`).json();
      const content = await Diff({ docuId, from, to }, original.data, modified.data, this.options);

      this.setState(
        {
          isLoaded: true,
          content
        }
      );
    };

    fetchDiff().catch((error) => {
      if (error.response && error.response.status == 403){
        store.dispatch(logOut());
      }
      
      this.setState({
        isLoaded: true,
        error,
      })
    });
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
  changes: PropTypes.array.isRequired,
};


const mapStateToProps = (state) => (
  {
    changes: state.changes || []
  }
);

export default hot(module)(connect(mapStateToProps)(DiffViewEditor));
