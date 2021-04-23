import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import 'codemirror/lib/codemirror.css';
import PropTypes from 'prop-types';
import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { logOut } from '../actions';
import DiffViewEditor from '../components/DiffViewEditor';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';

/**
 * Edit page encompasses the Editor and DiffViewEditor components.
 * It shows the edit page to the user and allows to save the changes.
 */
class DiffPage extends React.Component {
  file = null;

  editorRef = React.createRef();

  state = {
    content: null,
    isLoaded: false,
    saveStatus: '',
    saveMessage: '',
  };

  constructor(props) {
    super(props);
    const { file } = props;
    this.file = decodeURIComponent(file);
    this.handleSave = this.handleSave.bind(this);
  }

  componentDidMount() {
    const { docuId, to } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${encodeURIComponent(this.file)}`).json();
      this.setState({
        content: json.data,
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
      error, isLoaded, content, saveStatus, saveMessage,
    } = this.state;

    const { from, to, docuId } = this.props;

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
                Editing file:
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

    return (
      <div className="editor-wrap">
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={12}>
            <h3>
              Editing file:
              {this.file}
            </h3>
          </Col>
        </Row>
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={6} md={12}>
            <Editor
              initialValue={content}
              previewStyle="global"
              height="100%"
              initialEditType="markdown"
              useCommandShortcut
              ref={this.editorRef}
              frontMatter
            />
          </Col>
          <Col xl={6} md={12}>
            <DiffViewEditor from={from} docuId={docuId} to={to} file={this.file} />
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

DiffPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
  to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
});

export default hot(module)(connect(mapStateToProps)(DiffPage));
