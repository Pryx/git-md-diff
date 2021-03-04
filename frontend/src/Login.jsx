import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import PropTypes from 'prop-types';
import { Button, Card } from 'react-bootstrap';
import { store } from './store/index';
import { logIn, logOut } from './actions';
import { connect } from "react-redux";
import { Redirect } from 'wouter';


class Login extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(props){
  }

  render() {
    const {
      error, success, userLoaded,
    } = this.props;

    

    let alert = null;
    if (error){
      alert = <Alert variant={danger}>An error has occured, please try again later!</Alert>;;
    } 

    if (success){
      fetch(`/api/users/current`)
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

    if (this.props.logout){
      fetch(`/api/auth/logout`)
      .then((r) => r.json())
      .then((data) => {
        console.log(data);
        store.dispatch( logOut() );
        }
      );

      if (this.props.loggedIn){
        return (
          <Container className="mt-5">
            <h1>Logging you out, please wait...</h1>
          </Container>
        );
      }

      return <Redirect to="/login"></Redirect>
    }

    return (
      <Container className="mt-5">
        <Card>
          {alert}
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
  logout: false
};

Login.propTypes = {
  error: PropTypes.bool,
  success: PropTypes.bool,
  logout: PropTypes.bool
};
const mapStateToProps = state => {
  return { loggedIn: state.loggedIn||false };
};
export default hot(module)(connect(mapStateToProps)(Login));
