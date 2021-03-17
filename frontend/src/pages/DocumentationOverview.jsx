import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Form } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import slugify from 'slugify';
import { Redirect } from 'wouter';
import { Alert } from 'react-bootstrap';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationOverview extends React.Component {
  state = {
    success: false,
    error: ""
  }

  render() {
    return (
      <Container className="mt-5">
        <Row>
          <Col lg={12} xs={12}>
            <Alert variant="info">This will be the Documentation page</Alert>
          </Col>
        </Row>
      </Container>
    );
  }
}

DocumentationOverview.propTypes = {
};


export default hot(module)(DocumentationOverview);
