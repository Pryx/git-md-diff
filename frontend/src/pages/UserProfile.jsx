import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { store } from '../store/index';
import { documentationSelected, logOut } from '../actions';
import { Alert, Button, Card, Form, Table } from 'react-bootstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import accessLevels from '../constants/access-levels';
import DiffWrapper from '../components/DiffWrapper';
import { Link, Redirect } from 'wouter';
import Select from 'react-select';
import ky from 'ky';
import UserAdd from '../components/UserAdd';
import lodash from 'lodash'


/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class UserProfile extends React.Component {
  state = {
    success: false,
    error: "",
    user: null
  }

  componentDidMount(){
    const {id} = this.props
    const fetchCommits = async () => {
      const json = await ky(`/api/users/${id}`).json();

      this.setState(
        {
          isLoaded: true,
          user: json.data,
        },
      );
    };

    fetchCommits().catch((error) => {
      if (error.response && error.response.status == 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error,
      })
    });
  }

  render() {
    const {userData, id} = this.props;
    let user = userData;
    console.log(id)
    if (id){
      user = this.state.user;
    }

    if (user != null){
      return (
        <Container className="mt-5">
          <Row>
            <Col lg={12} xs={12}>
              <Card>
                <Card.Header>User: {user.name}</Card.Header>
                <Card.Body>
                  Email: {user.email}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    }
    else {
      return null;
    }
  }
}

UserProfile.propTypes = {
  userData: PropTypes.object
};

const mapStateToProps = (state) => (
  {
    userData: state.userData
  }
);

export default hot(module)(connect(mapStateToProps)(UserProfile));