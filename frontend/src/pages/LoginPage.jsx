import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Button, Card } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import { hot } from 'react-hot-loader';
import { Redirect } from 'wouter';
import { logoutUser } from '../helpers/secure-ky';

/**
 * The login page displays the login form or error, if redirected to the error page
 */
class LoginPage extends React.Component {
  state = { error: null };

  componentWillUnmount() {
    this.setState({});
  }

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      loginError, logout,
    } = this.props;

    if (logout) {
      logoutUser();
      return <Redirect to="/" />;
    }

    const {
      error,
    } = this.state;

    let alert = null;
    if (loginError) {
      alert = <Alert variant="danger">An error has occured, please try again later!</Alert>;
    } else if (error) {
      alert = <Alert variant="danger">{error}</Alert>;
    }

    return (
      <Container className="mt-5">
        {alert}
        <Card>
          <Card.Header as="h5">Log in</Card.Header>
          <Card.Body>
            <Card.Title>You need to login before you start using the app</Card.Title>
            <Button variant="success" href={`${window.env.api.backend}/auth/gitlab`}>Log in using GitLab</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

LoginPage.defaultProps = {
  loginError: false,
  logout: false,
};

LoginPage.propTypes = {
  loginError: PropTypes.bool,
  logout: PropTypes.bool,
};
export default hot(module)(LoginPage);
