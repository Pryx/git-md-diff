import {
  Tooltip, Alert, Badge, OverlayTrigger,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import React from 'react';

import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import Diff from '../../helpers/diff';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';

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

  /**
   * Fetch the pages on mount and diff them
   */
  componentDidMount() {
    const {
      docuId, from, to, file,
    } = this.props;

    const fetchChanges = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/changes/${from}/${to}`).json();
      const changes = json.data;

      const { oldFile, newFile } = changes.find((v) => v.newFile === file);

      const original = secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${from}/pages/${oldFile}`).json();
      const modified = secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${newFile}`).json();
      const content = await Diff(
        { docuId, from, to },
        (await original).data,
        (await modified).data,
        this.options,
      );

      this.setState(
        {
          isLoaded: true,
          content,
        },
      );
    };

    fetchChanges().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        error: errorMessage,
        isLoaded: true,
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
            <Alert variant="danger" className="mt-3">Error rendering changes:</Alert>
            {' '}
            <pre>
              {error.toString()}
            </pre>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div>
          <div>
            Invisible changes: Loading...
          </div>
          <div>Loading...</div>
        </div>
      );
    }

    let badges = null;
    if (content.badges.length) {
      badges = content.badges.map((change) => (
        <OverlayTrigger key={change.id} overlay={<Tooltip>{change.description}</Tooltip>}>
          <Badge variant={change.variant}>{change.title}</Badge>
        </OverlayTrigger>
      ));
    }

    let cls = '';
    if (content.newFile) {
      cls = 'newfile';
      badges.push(
        <OverlayTrigger
          key="newfile"
          overlay={(
            <Tooltip>
              This file was not present in the starting commit.
            </Tooltip>
      )}>
          <Badge variant="success">Added new file</Badge>
        </OverlayTrigger>,
      );
    }

    return (
      <div className="mt-4" id="editor-diff">
        <div className="editor-badges">
          {badges}
        </div>
        <hr />
        <div className={`editor-diff-content ${cls}`} dangerouslySetInnerHTML={{ __html: content.content }} />
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
    docuId: state.docuId,
  }
);

export default hot(module)(connect(mapStateToProps)(EditorDiff));
