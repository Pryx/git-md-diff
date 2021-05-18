import React from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import slugify from 'slugify';
import { Redirect } from 'wouter';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';

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
  };

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
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
      slug, description, name, success, error,
    } = this.state;
    if (success) {
      return (<Redirect to="/" />);
    }

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          {error}
        </Alert>
      );
    }

    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <h2>New documentation</h2>
          </Col>
        </Row>
        <Row>
          <Col>
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
          </Col>
        </Row>
      </Container>
    );
  }
}

NewDocumentation.propTypes = {
};

export default hot(module)(NewDocumentation);
