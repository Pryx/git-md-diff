import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Breadcrumb, Button, Card, Form,
} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import slugify from 'slugify';
import { Link, Redirect } from 'wouter';
import DocuUsers from '../components/docu/DocuUsers';
import accessLevels from '../constants/access-levels';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';

/**
 * The documentation settings, which can be accessed by the admin only
 */
class DocumentationSettings extends React.Component {
  state = {
    error: '',
    deleted: false,
    slug: '',
    name: '',
    description: '',
    isLoaded: false,
    docu: {},
  };

  constructor(props) {
    super(props);

    this.handleSlugUpdate = this.handleSlugUpdate.bind(this);
    this.handleNameUpdate = this.handleNameUpdate.bind(this);
    this.slugControl = React.createRef();
    this.handleDescriptionUpdate = this.handleDescriptionUpdate.bind(this);
    this.handleDeleteDocu = this.handleDeleteDocu.bind(this);
    this.deleteDocu = this.deleteDocu.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * When mounted, fetches the documentation data
   */
  componentDidMount() {
    const { docuId } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}`).json();
      this.setState({
        docu: json.data,
        slug: json.data.slug,
        name: json.data.name,
        description: json.data.description,
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
   * Displays the delete dialog before deleting the documentation
   */
  handleDeleteDocu() {
    this.dialog.show({
      title: 'Documentation delete',
      body: 'Do you want to delete the linked repository too? If you keep the repository you can re-import the documentation later.',
      bsSize: 'md',
      actions: [
        Dialog.CancelAction(),
        Dialog.Action(
          'Keep repository',
          () => { this.deleteDocu(false); },
          'btn-success',
        ),
        Dialog.Action(
          'Delete repository',
          () => this.deleteDocu(true),
          'btn-danger',
        ),
      ],
    });
  }

  /**
   * Saves the updated name to the internal state
   * @param {Event} e The JS event
   */
  handleNameUpdate(e) {
    const { origSlug } = this.state;
    this.setState({ name: e.target.value });
    if (this.slugChanged && !origSlug.length) {
      this.slugChanged = false;
    }

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

  /**
   * Updates the documentation based on the parameters
   * @param {Event} e The JS event
   */
  handleSubmit(e) {
    e.preventDefault();

    const { slug, name, description } = this.state;
    const { docuId } = this.props;

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
          id: docuId, name, slug, description, provider: 'gitlab',
        },
      }).json();

      if (json.success) {
        this.setState({ success: true });
      } else {
        this.setState({ error: json.error });
      }
    };

    putData().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens
      this.setState({
        error: `Internal server error: ${errorMessage}`,
      });
    });
  }

  /**
   * Actually deletes the documentation from the server
   * @param {boolean} deleteRepo indicates whether to delete the repository
   */
  deleteDocu(deleteRepo) {
    const { docuId } = this.props;
    const deleteDocu = async () => {
      await secureKy().delete(`${window.env.api.backend}/documentations/${docuId}`, { json: { deleteRepo } }).json();

      this.setState(
        {
          deleted: true,
        },
      );
    };

    deleteDocu().catch(async (error) => {
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
      slug, name, description, deleted, error, success, docu, isLoaded,
    } = this.state;

    const { docuId } = this.props;
    const breadcrumbs = (
      <Row>
        <Col>
          <Breadcrumb>
            <Link to="/">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>
            <Link to={`/documentation/${docuId}`}>
              <Breadcrumb.Item>
                Documentation
                {' '}
                {docuId}
              </Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>Settings</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
    );

    if (!isLoaded) {
      return (
        <Container className="mt-3">
          {breadcrumbs}
          <Row>
            <Col>
              Loading...
            </Col>
          </Row>
        </Container>
      );
    }

    if (docu.accessLevel > accessLevels.admin) {
      return <Redirect to="/" />;
    }

    if (deleted) {
      return <Redirect to="/" />;
    }

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          {error}
        </Alert>
      );
    }

    if (success) {
      alert = (
        <Alert variant="success">
          Successfully updated
        </Alert>
      );
    }

    return (
      <Container className="mt-3">
        {breadcrumbs}
        <Row>
          <Col>
            <h1>
              {docuId}
              {' '}
              - Settings
            </h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <Card.Header>Documentation settings</Card.Header>
              <Card.Body>
                {alert}
                <Form onSubmit={this.handleSubmit}>
                  <Form.Row>
                    <Form.Group controlId="name" as={Col}>
                      <Form.Label>Documentation name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter name"
                        onChange={this.handleNameUpdate}
                        value={name}
                        required
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
                  <Button variant="danger" className="float-left" onClick={this.handleDeleteDocu}>
                    Delete
                  </Button>
                  <Button variant="success" type="submit" className="float-right">
                    Save
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <DocuUsers docu={docu} />
          </Col>
        </Row>

        <Dialog ref={(component) => { this.dialog = component; }} />
      </Container>
    );
  }
}

DocumentationSettings.propTypes = {
  docuId: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList,
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationSettings));
