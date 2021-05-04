import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import 'codemirror/lib/codemirror.css';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Breadcrumb, Form } from 'react-bootstrap';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import {
  documentationSelected, logOut, pageAutosave, pageAutosaveRemove,
} from '../actions';
import EditorPreview from '../components/EditorPreview';
import EditorWrapper from '../components/EditorWrapper';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';

/**
 * Edit page encompasses the Editor and EditorPreview components.
 * It shows the edit page to the user and allows to save the changes.
 */
class EditPage extends React.Component {
  file = null;

  editorRef = React.createRef();

  state = {
    content: null,
    isLoaded: false,
    saveStatus: '',
    saveMessage: '',
    saving: false,
    commitMessage: '',
  };

  editorInit = false;

  constructor(props) {
    super(props);
    const { file, docuId } = props;

    store.dispatch(documentationSelected(docuId));

    this.file = decodeURIComponent(file);
  }


  render() {
    const {
      error
    } = this.state;

    const {
      docuId, version, from, to, file,
    } = this.props;

    if (error) {
      return (
        <Container className="editor-wrap">
          <Alert variant="danger">{error}</Alert>
        </Container>
      );
    }

    return (
      <div className="editor-wrap">
        <Row className="mt-3 mr-3 ml-3">
          <Col>
            <Breadcrumb>
              <Link href="/">
                <Breadcrumb.Item>Home</Breadcrumb.Item>
              </Link>
              <Link href={`/documentation/${docuId}`}>
                <Breadcrumb.Item>
                  Documentation {docuId}
                </Breadcrumb.Item>
              </Link>
              <Breadcrumb.Item active><strong>Edit file</strong> {this.file}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <EditorWrapper
          docuId={docuId}
          version={version}
          from={from}
          to={to}
          file={file} />
      </div>
    );
  }
}

EditPage.defaultProps = {
  from: null,
  onSave: null,
  version: '',
  autosaved: {},
};

EditPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  version: PropTypes.string,
  onSave: PropTypes.func,
  autosaved: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
};

const mapStateToProps = (state) => ({
  autosaved: state.autosaved || {},
});

export default hot(module)(connect(mapStateToProps)(EditPage));
