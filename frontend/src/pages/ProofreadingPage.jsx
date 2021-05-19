import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Badge, Breadcrumb } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import { documentationSelected } from '../actions';
import ProofreadingDiffWrapper from '../components/proofreading/ProofreadingDiffWrapper';
import { proofreadingStates, proofreadingStatesString } from '../constants/proofreading-states';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';
import User from '../shapes/user';
import { store } from '../store';

/**
 * This is the main proofreading request page, is similar to the
 * documentation page with a set diff range and some minor modifications.
 */
class ProofreadingPage extends React.Component {
  state = {
    error: '',
    isLoaded: false,
    req: null,
  };

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { isLoaded: true, error };
  }

  /**
   * Fetches the proofreading request data when mounted
   */
  componentDidMount() {
    const { reqId } = this.props;
    const fetchData = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/proofreading/${reqId}`).json();
      store.dispatch(documentationSelected(json.data.docuId));

      this.setState({
        req: json.data,
        isLoaded: true,
      });
    };

    fetchData().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  render() {
    const {
      req, isLoaded, error,
    } = this.state;
    const { userData, docuId, reqId } = this.props;

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
            <Breadcrumb.Item active>
              Proofreading request
              {' '}
              {reqId}
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

    const alert = null;

    if (error) {
      return (
        <Container className="mt-3">
          <Row>
            <Col>
              <Alert variant="danger">{error.toString()}</Alert>
            </Col>
          </Row>
        </Container>
      );
    }

    let badgeVar;

    switch (req.state) {
      case proofreadingStates.new:
        badgeVar = 'secondary';
        break;

      case proofreadingStates.inprogress:
        badgeVar = 'primary';
        break;

      case proofreadingStates.merged:
      case proofreadingStates.submitted:
        badgeVar = 'success';
        break;

      case proofreadingStates.rejected:
        badgeVar = 'danger';
        break;

      default:
        badgeVar = 'light';
        break;
    }

    if (userData.id === req.requester.id) {
      return (
        <Container className="mt-3">
          {breadcrumbs}
          {alert}
          <Row>
            <Col>
              <h1>
                {req.title}
              </h1>
              <Badge variant={badgeVar} className="mr-2 mt-2 mb-2 main-proofreading-badge">
                {proofreadingStatesString[req.state]}
              </Badge>
              <p className="text-muted">{req.description}</p>
            </Col>
          </Row>
          <Row className="mt-2 mb-5">
            <Col className="contact-info">
              <h2>Proofreader:</h2>
              <h3>{req.proofreader.name}</h3>
              <a href={`mailto:${req.proofreader.email}`}>{req.proofreader.email}</a>
            </Col>
            <Col className="contact-info">
              <h2>Submitter:</h2>
              <h3>{req.requester.name}</h3>
              <a href={`mailto:${req.requester.email}`}>{req.requester.email}</a>
            </Col>
          </Row>
          <ProofreadingDiffWrapper
            proofreadingReq={req}
            onClick={this.merge}
            proofreader={false}
            disabledText="You can&apos;t merge this yet, because the proofreader has not marked the request as completed."
          />
        </Container>
      );
    }

    return (
      <Container className="mt-3">
        {breadcrumbs}
        {alert}
        <Row>
          <Col>
            <h1>
              {req.title}
            </h1>
            <Badge variant={badgeVar} className="mr-2 mt-2 mb-2 main-proofreading-badge">
              {proofreadingStatesString[req.state]}
            </Badge>
            <p className="text-muted">{req.description}</p>
          </Col>
        </Row>
        <Row className="mt-2 mb-5">
          <Col className="contact-info">
            <h2>Proofreader:</h2>
            <h3>{req.proofreader.name}</h3>
            <a href={`mailto:${req.proofreader.email}`}>{req.proofreader.email}</a>
          </Col>
          <Col className="contact-info">
            <h2>Submitter:</h2>
            <h3>{req.requester.name}</h3>
            <a href={`mailto:${req.requester.email}`}>{req.requester.email}</a>
          </Col>
        </Row>
        <ProofreadingDiffWrapper
          proofreadingReq={req}
          onClick={this.submitProofread}
          noChangesMessage="You made no changes yet."
          proofreader
        />
      </Container>
    );
  }
}

ProofreadingPage.defaultProps = {
  userData: null,
};

ProofreadingPage.propTypes = {
  userData: PropTypes.shape(User),
  reqId: PropTypes.number.isRequired,
  docuId: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(ProofreadingPage));
