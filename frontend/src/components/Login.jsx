import PropTypes from 'prop-types';
import React from 'react';
import { Alert } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import { hot } from 'react-hot-loader';
import { Redirect } from 'wouter';
import { logIn, tokensReceived } from '../actions';
import {secureKy} from '../entities/secure-ky';
import { store } from '../store/index';

class Login extends React.Component {
  state = {
    error: null, userLoaded: false,
  };

  componentDidMount() {
    const { token, refreshToken } = this.props;

    store.dispatch(tokensReceived({ token, refreshToken }));

    const fetchUser = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/users/current`).json();
      this.setState(
        {
          userLoaded: true,
        },
      );
      store.dispatch(logIn(json.user));
    };

    fetchUser().catch((e) => this.setState({
      error: e.toString(),
    }));
  }

  render() {
    const {
      error, userLoaded,
    } = this.state;

    if (error) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">{error}</Alert>
        </Container>
      );
    }

    if (!userLoaded) {
      return (
        <Container className="mt-5">
          <h1>Logging you in, please wait...</h1>
        </Container>
      );
    }

    return <Redirect to="/" />;
  }
}

Login.propTypes = {
  token: PropTypes.string.isRequired,
  refreshToken: PropTypes.string.isRequired,
};

export default hot(module)(Login);
