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
import { documentationSelected, logOut, pageAutosave, pageAutosaveRemove } from '../actions';
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
  };

  editorInit = false;
  skipNotice = false;

  constructor(props) {
    super(props);
    const { file, docuId } = props;

    store.dispatch(documentationSelected(docuId));

    this.file = decodeURIComponent(file);
    this.handleSave = this.handleSave.bind(this);
    
    this.debouncedAutosave = lodash.debounce(function() {
      if (!this.editorInit) {
        this.editorInit = true;
        return;
      }
      console.trace();
      const {docuId} = this.props;
      const content = this.editorRef.current.getInstance().getMarkdown();
      this.setState({
        previewContent: content,
        isLoaded: true,
      });
      store.dispatch(pageAutosave(docuId, this.file, content))
    }, 250);
  }


  componentDidMount() {
    const { docuId, to } = this.props;

    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${encodeURIComponent(this.file)}`).json();
      this.setState({
        content: json.data,
        previewContent: json.data,
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
    // TODO: Rewrite
    console.error('Still needs updated implementation...');
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: this.file,
        repo: this.repo,
        commit: this.endRevision,
        content: this.editorRef.current.getInstance().getMarkdown(),
      }),
    };

    fetch(`${window.env.api.backend}/save`, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.setState({ saveStatus: 'success', saveMessage: 'Successfully saved!' });
        } else {
          this.setState({ saveStatus: 'danger', saveMessage: data.error });
        }
      });
  }

  render() {
    const {
      error, isLoaded, content, saveStatus, saveMessage, previewContent
    } = this.state;

    const { from, to, autosaved, file, docuId } = this.props;

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
    

    let initialContent = content;
    let notice = null;

    const docuAutosave = autosaved[docuId] || {};
    if (docuAutosave[file] && !this.skipNotice){
      const autosavedFile = docuAutosave[file];
      initialContent = autosavedFile.content;

      const date = new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(autosavedFile.date));

      const restoreHandler = (e) => {
        e.preventDefault(); 
        this.editorRef.current.getInstance().setMarkdown(content);
        store.dispatch(pageAutosaveRemove(docuId, file))
      };

      const dismissHandler = (e) => {
        store.dispatch(pageAutosaveRemove(docuId, file));
      };

      notice = (
        <Alert variant="info" onClose={dismissHandler} dismissible>
        An autosaved version from {date} was automatically restored. <Alert.Link onClick={restoreHandler}>Click here if you want to restore the original</Alert.Link>.
        </Alert>
      );
      this.skipNotice = true;
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
              initialValue={initialContent}
              previewStyle="global"
              height="100%"
              initialEditType="markdown"
              useCommandShortcut
              ref={this.editorRef}
              onChange={() => this.debouncedAutosave()}
              frontMatter
            />
          </Col>
          <Col xl={6} md={12}>
            <EditorPreview file={this.file} previewOnly={!(from && to)} content={previewContent} />
          </Col>
        </Row>
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={6} md={12}>
            <div className="clearfix mb-2">
              <Button variant="success" className="float-right" onClick={this.handleSave}>Save</Button>
            </div>
            {saveStatus.length > 0
              && (
                <Alert variant={saveStatus}>
                  {saveMessage}
                </Alert>
              )}
          </Col>
        </Row>
      </div>
    );
  }
}

EditPage.defaultProps = {
  from: null,
};

EditPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  autosaved: state.autosaved || {},
});

export default hot(module)(connect(mapStateToProps)(EditPage));
