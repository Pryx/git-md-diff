import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Form } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import slugify from 'slugify';
import { Redirect } from 'wouter';
import { Alert } from 'react-bootstrap';
import { store } from '../store';
import { logOut } from '../actions';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class NewDocumentation extends React.Component {
  slugChanged = false;
  state = {
    slug: "",
    name: "",
    description: "",
    success: false,
    error: ""
  }

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSlugUpdate = this.handleSlugUpdate.bind(this);
    this.handleNameUpdate = this.handleNameUpdate.bind(this);
    this.slugControl = React.createRef();
    this.handleDescriptionUpdate = this.handleDescriptionUpdate.bind(this);

  }

  handleSubmit(e) {
    e.preventDefault();

    const { slug, name, description } = this.state

    const fetchUser = async () => {
      const json = await ky(`/api/users/current`).json();
      this.setState(
        {
          userLoaded: true,
        },
      );
      store.dispatch(logIn(json.user));
    };

    fetchUser().catch((error) => {
      if (error.response && error.response.status == 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error,
      })
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, slug, description, provider: 'gitlab'
      }),
    };

    fetch('/api/documentations/create', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.setState({ success: true });
        } else {
          this.setState({ error: data.error });
        }
      },
        (data) => {
          this.setState({
            error: data.error,
          });
        });
    return false;
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

  render() {
    const { slug, description, name, success, error } = this.state;
    if (success) {
      return (<Redirect to="/" />);
    }

    let alert = null;
    if (error) {
      alert = <Alert variant="danger">An error has occured: {error}</Alert>;
    }

    return (
      <Container className="mt-5">
        <Row>
          <Col lg={12} xs={12}>
            <h2>New documentation</h2>
          </Col>
        </Row>
        <Row>
          <Col lg={12} xs={12}>
            {alert}
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
