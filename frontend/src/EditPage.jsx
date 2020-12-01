import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Alert from 'react-bootstrap/Alert';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import DiffViewEditor from './DiffViewEditor';

class DiffPage extends React.Component {
  repo = null;
  from = null;
  to = null;
  file = null;

  editorRef = React.createRef();

  constructor(props) {
    super(props);
    this.repo = props.repo;
    this.from = props.from;
    this.to = props.to;
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
    fetch(`http://localhost:3000/${this.repo}/file/${encodeURIComponent(this.file)}/${this.from}`)
      .then((r) => r.json())
      .then(
        (data) => {
          this.setState({
            content: data.content,
            isLoaded: true,
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  handleSave(e) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: this.file, repo: this.repo, commit: this.to, content: this.editorRef.current.getInstance().getMarkdown() }),
    };

    fetch('http://localhost:3000/save', requestOptions)
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
            <DiffViewEditor from={this.from} repo={this.repo} to={this.to} file={this.file} />
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

export default hot(module)(DiffPage);
