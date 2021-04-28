import PropTypes from 'prop-types';
import React from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import EditorDiff from './EditorDiff';
import MDXPreview from './MDXPreview';

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
      error,
    } = this.state;
    const {
      file, previewOnly, content, from, to,
    } = this.props;

    if (previewOnly) {
      return (
        <Tabs defaultActiveKey="preview" id="editortabs">
          <Tab eventKey="preview" title="Preview">
            <MDXPreview content={content} />
          </Tab>
        </Tabs>
      );
    }

    return (
      <Tabs defaultActiveKey="preview" id="editortabs">
        <Tab eventKey="preview" title="Preview">
          <MDXPreview content={content} />
        </Tab>
        <Tab eventKey="differences" title={`Differences between ${from} and ${to}`}>
          <EditorDiff file={file} from={from} to={to} />
        </Tab>
      </Tabs>
    );
  }
}

EditorPreview.defaultProps = {
  content: '',
};

EditorPreview.propTypes = {
  file: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuId: state.docuId,
  }
);

export default hot(module)(connect(mapStateToProps)(EditorPreview));
