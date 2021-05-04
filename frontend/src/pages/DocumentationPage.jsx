import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Breadcrumb, Button, Tab, Tabs,
} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { Link, Redirect } from 'wouter';
import { documentationSelected, logOut } from '../actions';
import DiffWrapper from '../components/DiffWrapper';
import FileViewWrapper from '../components/FileViewWrapper';
import NewProofreadingRequest from '../components/NewProofreadingRequest';
import ProofreadingOverview from '../components/ProofreadingOverview';
import accessLevels from '../constants/access-levels';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationPage extends React.Component {
  state = {
    error: '',
    isLoaded: false,
    newRequest: false,
  };

  constructor(props) {
    super(props);

    const { docuId } = this.props;
    store.dispatch(documentationSelected(docuId));

    this.newRequest.bind(this);
  }

  componentDidMount() {
    const { docuId } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}`).json();
      this.setState({
        docu: json.data,
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

  newRequest(e) {
    e.preventDefault();
    const { docuId } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/proofreading/${docuId}`).json();
      this.setState({
        docu: json.data,
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

  render() {
    const { docuId } = this.props;
    const {
      error, docu, isLoaded, newRequest,
    } = this.state;

    const breadcrumbs = (
      <Row>
        <Col>
          <Breadcrumb>
            <Link href="/">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>
              Documentation {docuId}
            </Breadcrumb.Item>
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

    if (error) {
      return (
        <Container className="mt-3">
          {breadcrumbs}
          <Row>
            <Col>
              <Alert variant="danger">Error while rendering documentation data: {error}</Alert>
            </Col>
          </Row>
        </Container>
      );
    }

    let settings = null;
    if (docu.accessLevel <= accessLevels.manager) {
      if (docu.accessLevel === accessLevels.admin) {
        settings = (
          <Link href={`/documentation/${docuId}/settings`}>
            <Button variant="primary" className="float-right"><i className="fas fa-cog" /></Button>
          </Link>
        );
      }

      return (
        <Container className="mt-3">
          {breadcrumbs}
          <Row>
            <Col>
              <h1>
                {docu.name}
                {' '}
                {settings}
              </h1>
              <p className="text-muted">{docu.description}</p>
            </Col>
          </Row>
          <Tabs defaultActiveKey="files" id="docutabs">
            <Tab eventKey="files" title="Files">
              <FileViewWrapper />
            </Tab>
            <Tab eventKey="diff" title="Differences / Create proofreading request">
              {newRequest && (
                <NewProofreadingRequest
                  onCancel={() => this.setState({ newRequest: false })}
                />
              )}
              {!newRequest && (
                <DiffWrapper
                  onClick={() => this.setState({ newRequest: true })}
                />
              )}
            </Tab>
            <Tab eventKey="requests" title="Pending proofreading requests">
              <Row className="mt-4">
                <Col>
                  <ProofreadingOverview docuId={docuId} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Container>
      );
    }

    if (docu.accessLevel === accessLevels.author) {
      return (
        <Container className="mt-3">
          {breadcrumbs}
          <Row>
            <Col>
              <h1>{docu.name}</h1>
              <p className="text-muted">{docu.description}</p>
            </Col>
          </Row>
          <Tabs defaultActiveKey="files" id="docutabs">
            <Tab eventKey="files" title="Files">
              <FileViewWrapper />
            </Tab>
            <Tab eventKey="requests" title="Your proofreading requests">
              <Row className="mt-4">
                <Col>
                  <ProofreadingOverview docuId={docuId} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Container>
      );
    }

    return (<Container className="mt-3">
      {breadcrumbs}
      <Row>
        <Col>
          <h1>{docu.name}</h1>
          <p className="text-muted">{docu.description}</p>
        </Col>
      </Row>
      <Tabs defaultActiveKey="requests" id="docutabs">
        <Tab eventKey="requests" title="Your proofreading requests">
          <Row className="mt-4">
            <Col>
              <ProofreadingOverview docuId={docuId} />
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>);
  }
}

DocumentationPage.propTypes = {
  docuId: PropTypes.number.isRequired,
};

export default hot(module)(DocumentationPage);
