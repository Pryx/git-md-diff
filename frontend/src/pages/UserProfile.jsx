import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { logOut } from '../actions';
import {secureKy} from '../entities/secure-ky';
import User from '../entities/user';
import { store } from '../store/index';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class UserProfile extends React.Component {
  state = {
    error: '',
    user: null,
  };

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

    fetchCommits().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        error: error.toString(),
      });
    });
  }

  render() {
    const { userData, id } = this.props;
    let { user } = this.state;

    const { error } = this.state;

    if (error) {
      return (
        <Container className="mt-5">
          <Row>
            <Col lg={12} xs={12}>
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
            <Col lg={12} xs={12}>
              <Card>
                <Card.Header>
                  User:
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
  userData: PropTypes.shape(User.getShape()),
  id: PropTypes.number,
};

const mapStateToProps = (state) => (
  {
    userData: state.userData,
  }
);

export default hot(module)(connect(mapStateToProps)(UserProfile));
