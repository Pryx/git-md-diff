import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import 'codemirror/lib/codemirror.css';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-bootstrap';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import {
  documentationSelected, pageAutosave, pageAutosaveRemove,
} from '../../actions';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import { store } from '../../store';
import EditorPreview from './EditorPreview';
import { preventNav, allowNav } from '../../helpers/prevent-nav';

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
    modified: false,
  };

  editorInit = false;

  constructor(props) {
    super(props);
    const { file, docuId } = props;

    store.dispatch(documentationSelected(docuId));

    this.file = decodeURIComponent(file);
    this.handleSave = this.handleSave.bind(this);
    allowNav();
    this.debouncedAutosave = lodash.debounce(() => {
      if (!this.editorInit) {
        this.editorInit = true;
        return;
      }

      const content = this.editorRef.current.getInstance().getMarkdown();
      preventNav();
      this.setState({
        previewContent: content,
        autosaveDate: false,
        isLoaded: true,
        modified: true,
      });
      store.dispatch(pageAutosave(docuId, this.file, content));
    }, 250);
  }

  /**
   * Load page on mount
   */
  componentDidMount() {
    const { docuId, version, autosaved } = this.props;

    const fetchPage = async () => {
      const docuAutosave = autosaved[docuId] || {};
      const fileAutosave = docuAutosave[this.file] || {};

      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${this.file}`).json();

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

    fetchPage().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { isLoaded: true, error };
  }

  /**
   * Saves current state of page
   */
  handleSave() {
    const { docuId, version, onSave } = this.props;
    const { commitMessage } = this.state;

    this.setState({
      saving: true,
    });

    const savePage = async () => {
      const response = await secureKy().put(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${this.file}`,
        {
          json: { content: this.editorRef.current.getInstance().getMarkdown(), commitMessage },
        }).json();

      if (response.success) {
        allowNav();
        if (typeof onSave === 'function') {
          onSave();
        }
        store.dispatch(pageAutosaveRemove(docuId, this.file));
        this.setState({
          saving: false, saveStatus: 'success', commitMessage: '', saveMessage: 'Successfully saved!',
        });
      }
    };

    savePage().catch(async (error) => {
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
      error, isLoaded, content, saveStatus, saveMessage, modified,
      previewContent, autosaveDate, saving, commitMessage,
    } = this.state;

    const {
      from, to, file, docuId,
    } = this.props;

    if (!isLoaded) {
      return (
        <div>
          <Row className="mt-3 mr-3 ml-3">
            <Col>
              <h3>
                <i className="fas fa-file-alt" />
                {' '}
                {this.file}
              </h3>
            </Col>
          </Row>
          <Row className="mt-3 mr-3 ml-3">
            <Col>
              Loading...
            </Col>
          </Row>
        </div>
      );
    }

    let notice = null;
    let noticeBottom = null;

    if (error) {
      notice = (<Alert variant="danger">{error}</Alert>);
    } else if (saveStatus.length) {
      notice = (
        <Alert variant={saveStatus}>
          {saveMessage}
        </Alert>
      );
      noticeBottom = notice;
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
          <Alert.Link onClick={restoreHandler}>
            Click here if you want to edit the original instead
          </Alert.Link>
          .
        </Alert>
      );
    }

    return (
      <div>
        <Row className="mt-3 mr-3 ml-3">
          <Col>
            <h3>
              <i className="fas fa-file-alt" />
              {' '}
              {this.file}
            </h3>
          </Col>
        </Row>
        <Row className="mt-2 mr-3 ml-3">
          <Col xl={6} md={12}>
            {notice}
            <Editor
              initialValue={previewContent}
              previewStyle="global"
              height="80vh"
              initialEditType="markdown"
              useCommandShortcut
              ref={this.editorRef}
              onChange={() => this.debouncedAutosave()}
              frontMatter
            />

            <div className="pt-2 pb-5">
              {noticeBottom}
              <Form.Row id="edit-submit">
                <Form.Group as={Col} className="flex-grow-1">
                  <Form.Control
                    type="text"
                    placeholder="Write quick summary of your changes..."
                    onChange={(e) => this.setState({ commitMessage: e.target.value })}
                    value={commitMessage}
                  />
                </Form.Group>
                <Form.Group as={Col} className="submit-btn-wrap">
                  <Button variant="success" onClick={this.handleSave} disabled={(saving || !modified) ? 'disabled' : ''}>
                    Save (commit)
                  </Button>
                </Form.Group>
              </Form.Row>
            </div>
          </Col>
          <Col xl={6} md={12}>
            <EditorPreview
              file={this.file}
              previewOnly={!(from && to)}
              content={previewContent}
              from={from}
              to={to}
            />
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
