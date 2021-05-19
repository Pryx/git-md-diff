import {
  Tab, Alert, Button, Form, Tabs,
} from 'react-bootstrap';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import slugify from 'slugify';
import { Redirect } from 'wouter';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';
import Select from 'react-select';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class NewDocumentation extends React.Component {
  slugChanged = false;

  state = {
    slug: '',
    name: '',
    description: '',
    success: false,
    error: '',
    docu: null
  };

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleImport = this.handleImport.bind(this);
    this.handleSlugUpdate = this.handleSlugUpdate.bind(this);
    this.handleNameUpdate = this.handleNameUpdate.bind(this);
    this.slugControl = React.createRef();
    this.handleDescriptionUpdate = this.handleDescriptionUpdate.bind(this);
  }

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { isLoaded: true, error };
  }

  componentDidMount(){
    const fetchDocus = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/provider/gitlab`).json();

      this.setState({
        docuList: json.data.map((u) => ({ value: u, label: `${u.name}` })),
        isLoaded: true,
      });
    };

    fetchDocus().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  /**
   * Creates a new documentation
   * @param {Event} e The JS event
   */
  handleSubmit(e) {
    e.preventDefault();

    const { slug, name, description } = this.state;

    if (slug.trim().length === 0) {
      this.setState({
        error: 'Slug cannot be empty.',
      });
      return;
    }

    if (name.trim().length === 0) {
      this.setState({
        error: 'Name cannot be empty.',
      });
      return;
    }

    const putData = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/documentations/`, {
        json: {
          name, slug, description, provider: 'gitlab',
        },
      }).json();

      if (json.success) {
        this.setState({ success: true });
      } else {
        this.setState({ error: `An error has occured: ${json.error}` });
      }
    };

    putData().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens
      this.setState({
        error: errorMessage,
      });
    });
  }


  /**
   * Imports a new documentation
   * @param {Event} e The JS event
   */
   handleImport(e) {
    e.preventDefault();

    const { docu } = this.state;

    const putData = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/documentations/`, {
        json: {
          ...docu.value, provider: 'gitlab',
        },
      }).json();

      if (json.success) {
        this.setState({ success: true });
      } else {
        this.setState({ error: `An error has occured: ${json.error}` });
      }
    };

    putData().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens
      this.setState({
        error: errorMessage,
      });
    });
  }

  /**
   * Saves the updated name to the internal state
   * @param {Event} e The JS event
   */
  handleNameUpdate(e) {
    this.setState({ name: e.target.value });

    if (!this.slugChanged) {
      const slug = slugify(e.target.value, { lower: true });
      this.setState({ slug });
    }
  }

  /**
   * Saves the updated description to the internal state
   * @param {Event} e The JS event
   */
  handleDescriptionUpdate(e) {
    this.setState({ description: e.target.value });
  }

  /**
   * Saves the updated slug to the internal state
   * @param {Event} e The JS event
   */
  handleSlugUpdate(e) {
    const { name } = this.state;
    this.setState({ slug: e.target.value });

    const slug = slugify(name, { lower: true });

    if (e.target.value.length === 0 || e.target.value === slug) {
      this.slugChanged = false;
    } else {
      this.slugChanged = true;
    }
  }

  render() {
    const {
      slug, description, name, success, error, docuList, docu
    } = this.state;
    if (success) {
      return (<Redirect to="/" />);
    }

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          {error.toString()}
        </Alert>
      );
    }

    console.log(docu);

    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <h2>New documentation</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <Tabs defaultActiveKey="new" id="docutabs">
              <Tab eventKey="new" title="Create new documentation">
                {alert}
                <Form onSubmit={this.handleSubmit}>
                  <Form.Row>
                    <Form.Group controlId="name" as={Col}>
                      <Form.Label>Documentation name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter name"
                        required
                        onChange={this.handleNameUpdate}
                        value={name}
                      />
                      <Form.Text className="text-muted">
                        Required: This name will be displayed in your dashboard.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group controlId="slug" as={Col}>
                      <Form.Label>Documentation slug</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter slug"
                        name="slug"
                        pattern="^[a-z0-9-]+$"
                        onChange={this.handleSlugUpdate}
                        ref={this.slugControl}
                        value={slug}
                        required
                      />
                      <Form.Text className="text-muted">
                        Required: This is the internal name used for links and more.
                      </Form.Text>
                    </Form.Group>
                  </Form.Row>
                  <Form.Group controlId="description">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Description"
                      value={description}
                      onChange={this.handleDescriptionUpdate}
                    />
                    <Form.Text className="text-muted">
                      This is primarily for your convenience,
                      so that you know what each documentation contains.
                      Can be left empty.
                    </Form.Text>
                  </Form.Group>
                  <Button variant="success" type="submit" className="float-right">
                    Create
                  </Button>
                </Form>
              </Tab>
              <Tab eventKey="import" title="Import documentation" >
                <Form.Group className="mt-3">
                  <Row>
                    <Col>
                      <Select 
                        onChange={(d) => {
                          this.setState({ docu: d });
                        }}
                        options={docuList} 
                        placeholder="Select documentation to import"
                        value={docu}></Select>
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col>
                      <Button variant="success" className="float-right" onClick={this.handleImport}>
                        Import!
                      </Button>
                    </Col>
                  </Row>
                </Form.Group>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    );
  }
}

NewDocumentation.propTypes = {
};

export default hot(module)(NewDocumentation);
