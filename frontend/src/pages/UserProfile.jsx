import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import User from '../shapes/user';
import { getPossiblyHTTPErrorMessage, secureKy } from '../helpers/secure-ky';

/**
 * User profile uses a simple reprezentation to show the profile of a user
 * This should be further extended to allow user to edit their information
 */
class UserProfile extends React.Component {
  state = {
    error: '',
    user: null,
  };

  /**
   * Fetches user information on mount
   */
  componentDidMount() {
    const { id } = this.props;

    if (!id) {
      return;
    }

    const fetchCommits = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/users/${id}`).json();

      this.setState(
        {
          user: json.data,
        },
      );
    };

    fetchCommits().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
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

  render() {
    const { userData, id } = this.props;
    let { user } = this.state;

    const { error } = this.state;

    if (error) {
      return (
        <Container className="mt-5">
          <Row>
            <Col>
              <Alert variant="info">{error}</Alert>
            </Col>
          </Row>
        </Container>
      );
    }

    if (!id) {
      user = userData;
    }

    if (user != null) {
      return (
        <Container className="mt-5">
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  User:
                  {' '}
                  {user.name}
                </Card.Header>
                <Card.Body>
                  Email:
                  {' '}
                  {user.email}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    }

    return null;
  }
}

UserProfile.defaultProps = {
  userData: {},
  id: false,
};

UserProfile.propTypes = {
  userData: PropTypes.shape(User),
  id: PropTypes.number,
};

const mapStateToProps = (state) => (
  {
    userData: state.userData,
  }
);

export default hot(module)(connect(mapStateToProps)(UserProfile));
