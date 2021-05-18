import React from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import DocuOverview from '../components/dashboard/DocuOverview';
import ProofreadingOverview from '../components/dashboard/ProofreadingOverview';

/**
 * The dashboard page which displays the overviews.
 */
const Dashboard = () => (
  <Container className="mt-5">
    <Row>
      <Col>
        <h2>Your documentations</h2>
      </Col>
    </Row>
    <DocuOverview />
    <Row className="mt-5">
      <Col>
        <h2>Your proofreading requests</h2>
      </Col>
    </Row>
    <ProofreadingOverview />
  </Container>
);

export default hot(module)(Dashboard);
