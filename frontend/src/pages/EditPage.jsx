import '@toast-ui/editor/dist/toastui-editor.css';
import 'codemirror/lib/codemirror.css';
import PropTypes from 'prop-types';
import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import {
  documentationSelected,
} from '../actions';
import EditorWrapper from '../components/EditorWrapper';
import { store } from '../store';

/**
 * Edit page encompasses the Editor and EditorPreview components.
 * It shows the edit page to the user and allows to save the changes.
 */
class EditPage extends React.Component {
  file = null;

  state = { error: null };

  constructor(props) {
    super(props);
    const { file, docuId } = props;

    store.dispatch(documentationSelected(docuId));

    this.file = decodeURIComponent(file);
  }

  render() {
    const {
      error,
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
                  Documentation
                  {' '}
                  {docuId}
                </Breadcrumb.Item>
              </Link>
              <Breadcrumb.Item active>
                <strong>Edit file</strong>
                {' '}
                {this.file}
              </Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <EditorWrapper
          docuId={docuId}
          version={version}
          from={from}
          to={to}
          file={file}
        />
      </div>
    );
  }
}

EditPage.defaultProps = {
  from: null,
  version: '',
};

EditPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  version: PropTypes.string,
};

export default hot(module)(EditPage);
