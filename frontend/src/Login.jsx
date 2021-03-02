import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import PropTypes from 'prop-types';
import { Button, Card } from 'react-bootstrap';
import { Redirect } from 'wouter';
import { store } from './store/index';
import { logIn, logOut } from './actions';


class Login extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      error, success, userLoaded, logout
    } = this.props;

    if (logout){
      store.dispatch( logOut() );
    }

    let alert = null;
    if (error){
      alert = <Alert variant={danger}>An error has occured, please try again later!</Alert>;;
    } 

    if (success){
      fetch(`/auth/user`)
      .then((r) => r.json())
      .then((data) => {
        store.dispatch( logIn(data.user) );
        this.setState(
          {
            userLoaded: true,
          }
        );
        }
      );
      
      if (!userLoaded){
        return (
          <Container className="mt-5">
            <h1>Logging you in, please wait...</h1>
          </Container>
        );
      }
    }

    return (
      <Container className="mt-5">
        <Card>
          {alert}
          <Card.Header as="h5">Log in</Card.Header>
          <Card.Body>
            <Card.Title>You need to login before you start using the app</Card.Title>
            <Button variant="success" href="http://localhost:3000/auth/gitlab">Log in using GitLab</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

Login.defaultProps = {
  error: false,
  success: false,
  logout: false
};

Login.propTypes = {
  error: PropTypes.boolean,
  success: PropTypes.boolean,
  logout: PropTypes.boolean,
};

export default hot(module)(Login);
