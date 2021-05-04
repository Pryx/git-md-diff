import React from 'react';
import { Alert, Badge, Col, Row } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import PropTypes from 'prop-types';
import { logOut } from '../actions';
import { secureKy } from '../entities/secure-ky';
import User from '../entities/user';
import { store } from '../store';
import { proofreadingStates, proofreadingStatesString } from '../constants/proofreading-states';

/**
 * Diff view shows the diff file contents. Currently this
 * even handles the file diffing itself, this should
 * probably be offloaded to the server.
 */
class ProofreadingOverview extends React.Component {
  state = {
    isLoaded: false,
  };

  componentDidMount() {
    const { docuId } = this.props;
    const url = docuId === -1 ? 
      `${window.env.api.backend}/proofreading` :
      `${window.env.api.backend}/proofreading/documentation/${docuId}`;

    const fetchDocus = async () => {
      const json = await secureKy().get(url).json();

      this.setState({
        proofReadingRequests: json.data,
        isLoaded: true,
      });
    };

    fetchDocus().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded, proofReadingRequests,
    } = this.state;

    const { userData } = this.props;

    if (error) {
      return (
        <Alert variant="danger">Error loading your proofreading requests. Please try again later</Alert>
      );
    }

    if (!isLoaded) {
      return (
        <Card className="docu-card">
          <Card.Header>
            Loading...
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
          <Card.Footer className="text-right">
            <small>Loading...</small>
          </Card.Footer>
        </Card>
      );
    }

    let items = null;
    if (proofReadingRequests.length) {
      items = proofReadingRequests.map((req) => {

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
        return (
          <Link key={req.id} href={`/documentation/${req.docuId}/proofreading/${req.id}`}>
            <Card className="docu-card">
              <Card.Header>
                <Badge variant={badgeVar}>{proofreadingStatesString[req.state]}</Badge>
                {' '}
                {req.title}
              </Card.Header>
              <Card.Body>
                {req.description}
              </Card.Body>
              <Card.Footer>
                <small>
                  Created by:
                {req.requester.id === userData.id ? <strong>You</strong> : req.requester.name}
                </small>
                <br />
                <small>
                  Proofread by:
                {req.proofreader.id === userData.id ? <strong>You</strong> : req.proofreader.name}
                </small>
              </Card.Footer>
            </Card>
          </Link>
        )
      });

      return (
        <Row>
          {items}
        </Row>
      );
    }

    return (
      <Row>
        <Col lg={12}>
          <Alert variant="info">You don&apos;t have any pending proofreading requests yet</Alert>
        </Col>
      </Row>
    );
  }
}

ProofreadingOverview.defaultProps = {
  docuId: -1
}

ProofreadingOverview.propTypes = {
  userData: PropTypes.shape(User.getShape()).isRequired,
  docuId: PropTypes.number
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(ProofreadingOverview));
