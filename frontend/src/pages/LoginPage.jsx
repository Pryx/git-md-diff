import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import PropTypes from 'prop-types';
import { Alert, Button, Card } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Redirect } from 'wouter';
import { store } from '../store/index';
import { logIn, logOut } from '../actions';

class Login extends React.Component {
  state = {
    userLoaded: false
  }
  render() {
    const {
      error, success, logout, loggedIn,
    } = this.props;

    const {
      userLoaded,
    } = this.state;

    let alert = null;
    if (error) {
      alert = <Alert variant="danger">An error has occured, please try again later!</Alert>;
    }

    if (success) {
      fetch('/api/users/current')
        .then((r) => r.json())
        .then((data) => {
          store.dispatch(logIn(data.user));
          this.setState(
            {
              userLoaded: true,
            },
          );
        });

      if (!userLoaded) {
        return (
          <Container className="mt-5">
            <h1>Logging you in, please wait...</h1>
          </Container>
        );
      }
    }

    if (logout) {
      fetch('/api/auth/logout')
        .then((r) => r.json())
        .then(() => {
          store.dispatch(logOut());
        });

      if (loggedIn) {
        return (
          <Container className="mt-5">
            <h1>Logging you out, please wait...</h1>
          </Container>
        );
      }

      return <Redirect to="/login" />;
    }

    return (
      <Container className="mt-5">
        {alert}
        <Card>
          <Card.Header as="h5">Log in</Card.Header>
          <Card.Body>
            <Card.Title>You need to login before you start using the app</Card.Title>
            <Button variant="success" href="/api/auth/gitlab">Log in using GitLab</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

Login.defaultProps = {
  error: false,
  success: false,
  logout: false,
};

Login.propTypes = {
  error: PropTypes.bool,
  success: PropTypes.bool,
  logout: PropTypes.bool,
  loggedIn: PropTypes.bool.isRequired,
};
const mapStateToProps = (state) => ({ loggedIn: state.loggedIn || false });
export default hot(module)(connect(mapStateToProps)(Login));
