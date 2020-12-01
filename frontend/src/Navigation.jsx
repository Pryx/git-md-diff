import { hot } from 'react-hot-loader';
import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import {Link} from 'wouter';

const Navigation = () => (
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

export default hot(module)(Navigation);
