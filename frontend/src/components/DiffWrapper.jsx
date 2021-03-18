import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CommitSelect from './CommitSelect';
import DiffOverview from './DiffOverview';
import { Alert } from 'react-bootstrap';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DiffWrapper extends React.Component {
  state = {
    error: null,
  };

  render() {
    const { error } = this.state;

    const { docuId, docuEmpty } = this.props;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    }

    if (docuEmpty) {
      return (
        <Alert variant="info">This documentation is empty!</Alert>
      );
    }

    return (
      <div className="diff">
        <Row className="mt-3 mb-2">
          <Col lg={12}><h2>Page revision comparison</h2></Col>
        </Row>
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            <strong>Starting with revision:</strong>
            <CommitSelect id="from" from />
          </Col>
          <Col lg={6} xs={12}>
            <strong>Ending with revision:</strong>
            <CommitSelect id="to" from={false} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <DiffOverview docu={docuId} />
          </Col>
        </Row>
      </div>
    );
  }
}

DiffWrapper.propTypes = {
  docuId: PropTypes.string.isRequired,
  docuEmpty: PropTypes.bool,
};

const mapStateToProps = (state) => ({ docuId: state.docuId, docuEmpty: state.docuEmpty });

export default hot(module)(connect(mapStateToProps)(DiffWrapper));
