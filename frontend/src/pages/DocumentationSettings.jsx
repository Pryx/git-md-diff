import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Card, Form,
} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import slugify from 'slugify';
import { Redirect } from 'wouter';
import { documentationSelected, logOut } from '../actions';
import DocuUsers from '../components/DocuUsers';
import accessLevels from '../constants/access-levels';
import Documentation from '../entities/documentation';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store/index';
/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationSettings extends React.Component {
  state = {
    error: '',
    deleted: false,
    slug: '',
    name: '',
    description: '',
  };

  constructor(props) {
    super(props);

    const { docuId, docuList } = this.props;
    store.dispatch(documentationSelected(docuId));
    this.docu = docuList.find((d) => d.id === docuId);

    this.handleSlugUpdate = this.handleSlugUpdate.bind(this);
    this.handleNameUpdate = this.handleNameUpdate.bind(this);
    this.slugControl = React.createRef();
    this.handleDescriptionUpdate = this.handleDescriptionUpdate.bind(this);
    this.handleDeleteDocu = this.handleDeleteDocu.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const { slug, name, description } = this.docu;
    this.setState({ slug, name, description });
  }

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

  handleDescriptionUpdate(e) {
    this.setState({ description: e.target.value });
  }

  handleSlugUpdate(e) {
    this.setState({ slug: e.target.value });
    this.slugChanged = true;
  }

  handleSubmit(e) {
    e.preventDefault();

    const { slug, name, description } = this.state;
    const { docuId } = this.props;

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
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      const errorMessage = (await error.response.json()).error;
      this.setState({
        error: `Error making request: ${errorMessage}`,
      });
    });

    return false;
  }

  deleteDocu(deleteRepo) {
    const docuId = this.docu.id;
    const deleteDocu = async () => {
      await secureKy().delete(`${window.env.api.backend}/documentations/${docuId}`, { json: { deleteRepo } }).json();

      this.setState(
        {
          deleted: true,
        },
      );
    };

    deleteDocu().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        error: error.toString(),
      });
    });
  }

  render() {
    const { docu } = this;

    if (docu.accessLevel > accessLevels.admin) {
      return <Redirect to="/" />;
    }

    const {
      slug, name, description, deleted, error, success,
    } = this.state;

    if (deleted) {
      return <Redirect to="/" />;
    }

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          Error:
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
      <Container className="mt-5">
        <Row>
          <Col lg={12} xs={12}>
            <h1>
              {docu.name}
              {' '}
              - Settings
            </h1>
          </Col>
        </Row>
        <Row>
          <Col lg={12} xs={12}>
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
                      This is primarily for your convenience, so that you know what each documentation contains.
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
          <Col lg={12} xs={12}>
            <DocuUsers docu={docu} />
          </Col>
        </Row>

        <Dialog ref={(component) => { this.dialog = component; }} />
      </Container>
    );
  }
}

DocumentationSettings.propTypes = {
  docuList: PropTypes.arrayOf(PropTypes.shape(Documentation.getShape())).isRequired,
  docuId: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList,
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationSettings));
