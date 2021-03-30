import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { store } from '../store/index';
import { documentationSelected } from '../actions';
import { Alert, Button, Card, Form, Table } from 'react-bootstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import accessLevels from '../constants/access-levels';
import DiffWrapper from '../components/DiffWrapper';
import { Link, Redirect } from 'wouter';
import Select from 'react-select';
import ky from 'ky';
import UserAdd from '../components/UserAdd';
import lodash from 'lodash'


/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationSettings extends React.Component {
  state = {
    success: false,
    error: "",
    users: []
  }

  constructor(props) {
    super(props);

    const { docuId, docuList } = this.props;
    store.dispatch(documentationSelected(docuId));
    this.docu = docuList.find(d => d.id == docuId);

    const { slug, name, description } = this.docu;
    this.state = { ...this.state, slug, name, description }

    this.handleSlugUpdate = this.handleSlugUpdate.bind(this);
    this.handleNameUpdate = this.handleNameUpdate.bind(this);
    this.slugControl = React.createRef();
    this.handleDescriptionUpdate = this.handleDescriptionUpdate.bind(this);
  }

  handleNameUpdate(e) {
    const { origSlug } = this.state
    this.setState({ name: e.target.value })
    if (this.slugChanged && !origSlug.length) {
      this.slugChanged = false;
    }

    if (!this.slugChanged) {
      const slug = slugify(e.target.value, { lower: true })
      this.setState({ slug: slug })
    }
  }

  handleDescriptionUpdate(e) {
    this.setState({ description: e.target.value })
  }

  handleSlugUpdate(e) {
    this.setState({ slug: e.target.value })
    this.slugChanged = true;
  }

  componentDidMount() {
    const docuId = this.docu.id;
    const fetchUsers = async () => {
      const json = await ky(`/api/documentations/${docuId}/users`).json();

      this.setState(
        {
          isLoaded: true,
          users: json.data,
        },
      );
    };

    fetchUsers().catch((error) => {
      if (error.response && error.response.status == 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error,
      })
    });
  }

  render() {
    const docu = this.docu;

    if (docu.accessLevel > accessLevels.admin) {
      return <Redirect to="/" />;
    }

    const accessLevelsFlipped = lodash.invert(accessLevels)
    console.log(accessLevelsFlipped)
    const { slug, name, description, users } = this.state
    const tableContent = users.map((u) => (
      <tr key={u.id}>
        <td>{u.id}</td>
        <td>{u.name}</td>
        <td>{u.email}</td>
        <td>{accessLevelsFlipped[u.accessLevel]}</td>
        <td><Button variant="danger" size="sm"><i className="fas fa-trash"></i></Button></td>
      </tr>)
    );

    return (
      <Container className="mt-5">
        <Row>
          <Col lg={12} xs={12}>
            <h1>{docu.name} - Settings</h1>
          </Col>
        </Row>
        <Row>
          <Col lg={12} xs={12}>
            <Card>
              <Card.Header>Documentation settings</Card.Header>
              <Card.Body>
                <Form onSubmit={this.handleSubmit}>
                  <Form.Row>
                    <Form.Group controlId="name" as={Col}>
                      <Form.Label>Documentation name</Form.Label>
                      <Form.Control type="text" name="name" placeholder="Enter name" required onChange={this.handleNameUpdate} value={name} />
                      <Form.Text className="text-muted">
                        Required: This name will be displayed in your dashboard.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group controlId="slug" as={Col}>
                      <Form.Label>Documentation slug</Form.Label>
                      <Form.Control type="text" placeholder="Enter slug" name="slug" pattern="^[a-z0-9-]+$" onChange={this.handleSlugUpdate} ref={this.slugControl} value={slug} required />
                      <Form.Text className="text-muted">
                        Required: This is the internal name used for links and more.
                      </Form.Text>
                    </Form.Group>
                  </Form.Row>
                  <Form.Group controlId="description">
                    <Form.Control as="textarea" rows={3} placeholder="Description" value={description} onChange={this.handleDescriptionUpdate} />
                    <Form.Text className="text-muted">
                      This is primarily for your convenience, so that you know what each documentation contains. Can be left empty.
                    </Form.Text>
                  </Form.Group>
                  <Button variant="danger" className="float-left">
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
            <Card>
              <Card.Header>User management</Card.Header>
              <Card.Body>
                <UserAdd docu={docu}></UserAdd>
                <Table className="mt-3" striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Access level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableContent}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    );
  }
}

DocumentationSettings.propTypes = {
  docuList: PropTypes.array
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationSettings));