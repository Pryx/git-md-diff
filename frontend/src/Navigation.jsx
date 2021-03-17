import { hot } from 'react-hot-loader';
import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Link } from 'wouter';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const Navigation = (props) => {
  const { userData, loggedIn } = props;
  if (loggedIn) {
    return (
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Link href="/"><Navbar.Brand>Git md diff</Navbar.Brand></Link>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="ml-auto">
              <Link href="/">
                <Nav.Link>Home</Nav.Link>
              </Link>
              <NavDropdown title={userData.name} id="basic-nav-dropdown">
                <Link href="/profile">
                  <NavDropdown.Item>Profile</NavDropdown.Item>
                </Link>
                <Link href="/logout">
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
            <Link href="/">
              <Nav.Link>Home</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

Navigation.propTypes = {
  userData: PropTypes.object,
  loggedIn: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
  return { loggedIn: state.loggedIn, userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(Navigation));
