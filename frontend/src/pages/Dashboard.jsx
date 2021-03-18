import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { connect } from 'react-redux';
import DocuOverview from '../components/DocuOverview';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class Dashboard extends React.Component {
  render() {
      return (
        <Container className="mt-5">
          <Row>
            <Col lg={12} xs={12}>
              <h2>Your documentations</h2>
            </Col>
          </Row>
            <DocuOverview />
          <Row className="mt-5">
            <Col lg={12} xs={12}>
              <h2>Your proof reading requests</h2>
            </Col>
          </Row>
          <Row>
            <Col lg={12} xs={12}>
             #Proof reading requests go here
            </Col>
          </Row>
        </Container>
      );
  }
}

Dashboard.propTypes = {
};

const mapStateToProps = (state) => ({ });

export default hot(module)(connect(mapStateToProps)(Dashboard));
