import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import 'codemirror/lib/codemirror.css';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import {
  documentationSelected, logOut, pageAutosave, pageAutosaveRemove,
} from '../actions';
import EditorPreview from '../components/EditorPreview';
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
  };

  editorInit = false;

  constructor(props) {
    super(props);
    const { file, docuId } = props;

    store.dispatch(documentationSelected(docuId));

    this.file = decodeURIComponent(file);
    this.handleSave = this.handleSave.bind(this);

    this.debouncedAutosave = lodash.debounce(function () {
      if (!this.editorInit) {
        this.editorInit = true;
        return;
      }

      const content = this.editorRef.current.getInstance().getMarkdown();

      this.setState({
        previewContent: content,
        autosaveDate: false,
        isLoaded: true,
      });
      store.dispatch(pageAutosave(docuId, this.file, content));
    }, 250);
  }

  componentDidMount() {
    const { docuId, version, autosaved } = this.props;

    const fetchPage = async () => {
      const docuAutosave = autosaved[docuId] || {};
      const fileAutosave = docuAutosave[this.file] || {};

      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${encodeURIComponent(this.file)}`).json();

      if (fileAutosave.content && fileAutosave.content === json.data) {
        store.dispatch(pageAutosaveRemove(docuId, this.file));
        fileAutosave.date = null;
      }

      this.setState({
        content: json.data,
        previewContent: fileAutosave.content || json.data,
        autosaveDate: fileAutosave.date,
        isLoaded: true,
      });
    };

    fetchPage().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

  handleSave(e) { // eslint-disable-line no-unused-vars
    const { docuId, version, onSave } = this.props;

    this.setState({
      saving: true,
    });

    const savePage = async () => {
      const response = await secureKy().put(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${encodeURIComponent(this.file)}`,
        {
          json: { content: this.editorRef.current.getInstance().getMarkdown() },
        }).json();

      if (response.success) {
        if (typeof onSave === 'function') {
          onSave();
        }
        store.dispatch(pageAutosaveRemove(docuId, this.file));
        this.setState({ saving: false, saveStatus: 'success', saveMessage: 'Successfully saved!' });
      } else {
        this.setState({ saving: false, saveStatus: 'danger', saveMessage: response.error });
      }
    };

    savePage();
  }

  render() {
    const {
      error, isLoaded, content, saveStatus, saveMessage, previewContent, autosaveDate, saving,
    } = this.state;

    const {
      from, to, file, docuId,
    } = this.props;

    if (error) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">{error}</Alert>
        </Container>
      );
    }

    if (!isLoaded) {
      return (
        <div className="p-5">
          <Row>
            <Col xl={12}>
              <h3>
                <i className="fas fa-file-alt" />
                {' '}
                {this.file}
              </h3>
            </Col>
          </Row>
          <Row>
            <Col xl={12}>
              Loading...
            </Col>
          </Row>
        </div>
      );
    }

    let notice = null;

    if (saveStatus.length) {
      notice = (
        <Alert variant={saveStatus}>
          {saveMessage}
        </Alert>
      );
    } else if (autosaveDate) {
      const date = new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(autosaveDate));

      const restoreHandler = (e) => {
        e.preventDefault();
        this.editorRef.current.getInstance().setMarkdown(content);
        store.dispatch(pageAutosaveRemove(docuId, file));
        this.setState({ previewContent: content, autosaveDate: false });
      };

      const dismissHandler = (e) => {
        e.preventDefault();
        store.dispatch(pageAutosaveRemove(docuId, file));
        this.setState({ autosaveDate: false });
      };

      notice = (
        <Alert variant="info" onClose={dismissHandler} dismissible>
          An autosaved version from
          {' '}
          <strong>{date}</strong>
          {' '}
          was automatically restored.
          {' '}
          <Alert.Link onClick={restoreHandler}>Click here if you want to edit the original instead</Alert.Link>
          .
        </Alert>
      );
    }

    return (
      <div className="editor-wrap">
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={12}>
            <h3>
              <i className="fas fa-file-alt" />
              {' '}
              {this.file}
            </h3>
          </Col>
        </Row>
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={6} md={12}>
            {notice}
            <Editor
              initialValue={previewContent}
              previewStyle="global"
              height="100%"
              initialEditType="markdown"
              useCommandShortcut
              ref={this.editorRef}
              onChange={() => this.debouncedAutosave()}
              frontMatter
            />

            <div className="mt-2">
              <Button variant="success" className="float-right" onClick={this.handleSave} disabled={saving ? 'disabled' : ''}>Save</Button>
            </div>
          </Col>
          <Col xl={6} md={12}>
            <EditorPreview file={this.file} previewOnly={!(from && to)} content={previewContent} from={from} to={to} />
          </Col>
        </Row>
      </div>
    );
  }
}

EditPage.defaultProps = {
  from: null,
  onSave: null,
  version: '',
};

EditPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  version: PropTypes.string,
  onSave: PropTypes.func,
};

const mapStateToProps = (state) => ({
  autosaved: state.autosaved || {},
});

export default hot(module)(connect(mapStateToProps)(EditPage));
