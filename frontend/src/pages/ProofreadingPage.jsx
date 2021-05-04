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
import { documentationSelected, logOut, revisionSelected } from '../actions';
import ProofreadingDiffWrapper from '../components/ProofreadingDiffWrapper';
import { proofreadingStates } from '../constants/proofreading-states';
import { secureKy } from '../entities/secure-ky';
import User from '../entities/user';
import { store } from '../store';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
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

    resolveReq().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

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
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      const err = await error.response.json();

      this.setState({
        isLoaded: true,
        error: err.error ? err.error : error.toString(),
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
            <Link href="/">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>
            <Link href={`/documentation/${docuId}`}>
              <Breadcrumb.Item>
                Documentation
                {' '}
                {docuId}
              </Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>
              Proofreading request
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

    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <h1>
              {req.title}
            </h1>
            <p className="text-muted">{req.description}</p>
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
  userData: PropTypes.shape(User.getShape()),
  reqId: PropTypes.number.isRequired,
  docuId: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(ProofreadingPage));
