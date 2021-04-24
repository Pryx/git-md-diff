import { hot } from 'react-hot-loader';
import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import { connect } from 'react-redux';
import Diff from '../diff/diff';
import { store } from '../store';
import { logOut } from '../actions';
import { secureKy } from '../entities/secure-ky';

/**
 * A slightly modified DiffView for display in the editor file.
 */
class EditorDiff extends React.Component {
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
      docuId, from, to, file,
    } = this.props;

    const fetchChanges = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/changes/${from}/${to}`).json();
      const changes = json.data;

      const { oldFile, newFile } = changes.find((v) => v.newFile === file);

      const original = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${from}/pages/${encodeURIComponent(oldFile)}`).json();
      const modified = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${encodeURIComponent(newFile)}`).json();
      const content = await Diff({ docuId, from, to }, original.data, modified.data, this.options);

      this.setState(
        {
          isLoaded: true,
          content,
        },
      );
    };

    fetchChanges().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error,
      });
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
    if (content.invisible.length) {
      badges = content.invisible.map((change) => (
        <Badge variant={change.variant} key={change.id}>{change.text}</Badge>
      ));
    }

    return (
      <div className="mt-4">
        <div className="editor-diff-content" dangerouslySetInnerHTML={{ __html: content.content }} />
        <hr />
        <div>
          {badges}
        </div>
      </div>
    );
  }
}

EditorDiff.defaultProps = {
  hideCode: false,
};

EditorDiff.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  docuId: PropTypes.number.isRequired,
  file: PropTypes.string.isRequired,
  hideCode: PropTypes.bool,
};

const mapStateToProps = (state) => (
  {
    from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
    to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
    docuId: state.docuId,
  }
);

export default hot(module)(connect(mapStateToProps)(EditorDiff));
