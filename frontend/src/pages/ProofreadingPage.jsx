import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Breadcrumb,
} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import { documentationSelected, revisionSelected } from '../actions';
import ProofreadingDiffWrapper from '../components/proofreading/ProofreadingDiffWrapper';
import { proofreadingStates } from '../constants/proofreading-states';
import User from '../shapes/user';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';
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

  constructor(props) {
    super(props);
    this.submitProofread = this.submitProofread.bind(this);
    this.merge = this.merge.bind(this);
  }

  /**
   * Fetches the proofreading request data when mounted
   */
  componentDidMount() {
    const { reqId, userData } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/proofreading/${reqId}`).json();
      store.dispatch(documentationSelected(json.data.docuId));
      store.dispatch(revisionSelected({
        from: true,
        revisionData: {
          commit: userData.id === json.data.requester.id ? json.data.revTo : json.data.revFrom,
        },
      }));

      store.dispatch(revisionSelected({
        from: false,
        revisionData: {
          branch: json.data.sourceBranch,
          commit: userData.id === json.data.requester.id ? json.data.sourceBranch : json.data.revTo,
        },
      }));

      this.setState({
        req: json.data,
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
   * Marks the proofreading request as completed
   * @param {Event} e The JS event
   */
  submitProofread(e) {
    e.preventDefault();
    const { reqId } = this.props;
    const resolveReq = async () => {
      await secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/submit`).json();

      this.setState({
        success: 'Successfully submitted your changes',
        isLoaded: true,
      });
    };

    resolveReq().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  /**
   * Merges the completed proofreading request
   * @param {Event} e The JS event
   */
  merge(e) {
    e.preventDefault();
    const { reqId } = this.props;
    const mergeReq = async () => {
      await secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/merge`).json();

      this.setState({
        success: 'Successfully merged proofread version!',
        isLoaded: true,
      });
    };

    mergeReq().catch(async (error) => {
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
      error, req, isLoaded, success,
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

    let alert = null;
    if (error) {
      alert = <Alert variant="danger">{error}</Alert>;
    } else if (success) {
      alert = <Alert variant="success">{success}</Alert>;
    }

    if (userData.id === req.requester.id) {
      const btnTitle = !success ? 'Merge' : '';
      return (
        <Container className="mt-3">
          {breadcrumbs}
          <Row>
            <Col>
              <h1>
                {req.title}
              </h1>
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
          <Alert variant="info" key="info">You are seeing changes made by the proofreader.</Alert>
          {alert}
          <ProofreadingDiffWrapper
            proofreadingReq={req}
            buttonTitle={btnTitle}
            onClick={this.merge}
            noChangesMessage="The proofreader has made no changes."
            proofreader={false}
            disabledText="You can&apos;t merge this yet, because the proofreader has not marked the request as completed."
          />
        </Container>
      );
    }

    let btnTitle = '';

    if ((req.state === proofreadingStates.new
      || req.state === proofreadingStates.inprogress
      || req.state === proofreadingStates.rejected) && !success) {
      btnTitle = 'Mark as complete';
    }

    if (!btnTitle.length) {
      alert = <Alert variant="info">Submitted for approval, no additional changes possible at this time</Alert>;
    }

    return (
      <Container className="mt-3">
        {breadcrumbs}
        <Row>
          <Col>
            <h1>
              {req.title}
            </h1>
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
        {alert}
        <ProofreadingDiffWrapper
          proofreadingReq={req}
          buttonTitle={btnTitle}
          onClick={this.submitProofread}
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
