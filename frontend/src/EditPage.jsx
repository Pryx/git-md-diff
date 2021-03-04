import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import DiffViewEditor from './DiffViewEditor';
import { connect } from "react-redux";

/**
 * Edit page encompasses the Editor and DiffViewEditor components.
 * It shows the edit page to the user and allows to save the changes.
 */
class DiffPage extends React.Component {
  repo = null;
  from = null;
  to = null;
  file = null;

  editorRef = React.createRef();

  constructor(props) {
    super(props);
    this.file = decodeURIComponent(props.file);
    this.state = {
      content: null,
      isLoaded: false,
      saveStatus: '',
      saveMessage: '',
    };

    this.handleSave = this.handleSave.bind(this);

  }

  componentDidMount() {
    fetch(`/api/documentations/${this.props.docuId}/${this.props.endRevision}/pages/${encodeURIComponent(this.file)}`)
      .then((r) => r.json())
      .then(
        (data) => {
          this.setState({
            content: data.content,
            isLoaded: true,
          });
        },

        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  handleSave(e) {
    alert('Still needs updated implementation...');
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: this.file, repo: this.repo, commit: this.endRevision, content: this.editorRef.current.getInstance().getMarkdown() }),
    };

    fetch('/api/save', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.setState({saveStatus: "success", saveMessage: "Successfully saved!"});
        } else {
          this.setState({saveStatus: "danger", saveMessage: data.error});
        }
      });
  }

  render() {
    const {
      error, isLoaded, content, saveStatus, saveMessage,
    } = this.state;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    }

    if (!isLoaded){
      return (
        <div className="p-5">
          <Row>
            <Col xl={12}>
              <h3>Editing file: {this.file}</h3>
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
      <div>
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={12}>
            <h3>Editing file: {this.file}</h3>
          </Col>
        </Row>
        <Row className="mt-3 mr-3 ml-3">
        <Col xl={6} md={12}>
            <Editor
              initialValue={content}
              previewStyle="tab"
              height="100%"
              initialEditType="markdown"
              useCommandShortcut={true}
              ref={this.editorRef}
            />
          </Col>
          <Col xl={6} md={12}>
            <DiffViewEditor from={this.startRevision} repo={this.docuId} to={this.endRevision} file={this.file} />
          </Col>
        </Row>
        <Row className="mt-3 mr-3 ml-3">
          <Col xl={6} md={12}>
            <div className="clearfix mb-2">
              <Button variant="success" className="float-right" onClick={this.handleSave}>Save</Button>
            </div>
            {saveStatus.length > 0 &&     
              <Alert variant={saveStatus}>
                {saveMessage}
              </Alert>   
            }
          </Col>
        </Row>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { docuId: state.docuId, startRevision: state.startRevision, endRevision: state.endRevision};
};

export default hot(module)(connect(mapStateToProps)(DiffPage));
