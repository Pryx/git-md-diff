import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Breadcrumb, Button, Tab, Tabs,
} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import { documentationSelected } from '../actions';
import ProofreadingOverview from '../components/dashboard/ProofreadingOverview';
import DiffWrapper from '../components/diff/DiffWrapper';
import FileViewWrapper from '../components/file-view/FileViewWrapper';
import NewProofreadingRequest from '../components/proofreading/NewProofreadingRequest';
import accessLevels from '../constants/access-levels';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';
import { store } from '../store';

/**
 * The documentation page, which displays different views appropriate
 * for different access levels.
 */
class DocumentationPage extends React.Component {
  state = {
    error: '',
    isLoaded: false,
    newRequest: false,
    docu: {},
  };

  constructor(props) {
    super(props);

    const { docuId } = this.props;
    store.dispatch(documentationSelected(docuId));

    this.newRequest.bind(this);
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
   * Creates a new proofreading request
   * @param {Event} e The JS event
   */
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

    fetchPage().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
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
            <Link to="/">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>
              Documentation
              {' '}
              {docuId}
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
              <Alert variant="danger">
                Error while rendering documentation data:
                {error}
              </Alert>
            </Col>
          </Row>
        </Container>
      );
    }

    let settings = null;
    if (docu.accessLevel <= accessLevels.manager) {
      if (docu.accessLevel === accessLevels.admin) {
        settings = (
          <Link to={`/documentation/${docuId}/settings`}>
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
              <h1>{docuId}</h1>
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

    return (
      <Container className="mt-3">
        {breadcrumbs}
        <Row>
          <Col>
            <h1>{docuId}</h1>
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
      </Container>
    );
  }
}

DocumentationPage.propTypes = {
  docuId: PropTypes.number.isRequired,
};

export default hot(module)(DocumentationPage);
