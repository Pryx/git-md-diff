import PropTypes from 'prop-types';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import User from './entities/user';

const Navigation = (props) => {
  const { userData } = props;
  if (userData) {
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

Navigation.defaultProps = {
  userData: {},
};

Navigation.propTypes = {
  userData: PropTypes.shape(User.getShape()),
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(Navigation));
