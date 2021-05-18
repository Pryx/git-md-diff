import PropTypes from 'prop-types';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import lodash from 'lodash';
import User from '../../shapes/user';

/**
 * This component encompasses the top menu
 * @param {*} props The react props
 * @returns the react component
 */
const Navigation = (props) => {
  const { userData } = props;

  if (!lodash.isEmpty(userData)) {
    return (
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Link to="/"><Navbar.Brand>Git md diff</Navbar.Brand></Link>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="ml-auto">
              <Link to="/">
                <Nav.Link>Home</Nav.Link>
              </Link>
              <NavDropdown title={userData.name} id="basic-nav-dropdown">
                <Link to="/profile">
                  <NavDropdown.Item>Profile</NavDropdown.Item>
                </Link>
                <Link to="/logout">
                  <NavDropdown.Item>Logout</NavDropdown.Item>
                </Link>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">Git md diff</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="ml-auto">
            <Link to="/">
              <Nav.Link>Home</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

Navigation.defaultProps = {
  userData: {},
};

Navigation.propTypes = {
  userData: PropTypes.shape(User),
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(Navigation));
