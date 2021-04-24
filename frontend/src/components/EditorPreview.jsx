import { hot } from 'react-hot-loader';
import React from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { connect } from 'react-redux';
import Diff from '../diff/diff';
import { store } from '../store';
import { logOut } from '../actions';
import { secureKy } from '../entities/secure-ky';
import EditorDiff from './EditorDiff';

/**
 * A slightly modified DiffView for display in the editor file.
 */
class EditorPreview extends React.Component {
  state = {
    isLoaded: false,
    content: '',
  };

  constructor(props) {
    super(props);
    this.options = { hideCode: props.hideCode, returnMdx: true };
  }

  render() {
    const {
      error, content
    } = this.state;
    const { file, previewOnly } = this.props;


    if (previewOnly){
      return (
        <Tabs defaultActiveKey="preview" id="uncontrolled-tab-example">
          <Tab eventKey="preview" title="Preview">
            #PREVIEW WILL BE HERE
          </Tab>
        </Tabs>
      );
    }

    return (
      <Tabs defaultActiveKey="differences" id="uncontrolled-tab-example">
        <Tab eventKey="differences" title="Differences">
          <EditorDiff file={file} />
        </Tab>
        <Tab eventKey="preview" title="Preview">
          #PREVIEW WILL BE HERE
        </Tab>
      </Tabs>
    );
  }
}

EditorPreview.defaultProps = {
  hideCode: false,
};

EditorPreview.propTypes = {
  file: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => (
  {
  }
);

export default hot(module)(connect(mapStateToProps)(EditorPreview));
