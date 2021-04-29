import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert, Button } from 'react-bootstrap';
import CommitSelect from './CommitSelect';
import DiffOverview from './DiffOverview';
import ProofreadingRequest from '../entities/proofreading-request';

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

    const {
      docuId, docuEmpty, proofreadingReq, onClick, buttonTitle,
    } = this.props;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    }

    if (docuEmpty) {
      return (
        <Alert variant="info mt-4">This documentation is empty. You should initialize this repository with your Docusaurus installation.</Alert>
      );
    }

    return (
      <div className="diff">
        {!proofreadingReq && (
        <Row className="select-diff mt-4">
          <Col lg={6} xs={12}>
            <strong>Starting with revision:</strong>
            <CommitSelect id="from" from />
          </Col>
          <Col lg={6} xs={12}>
            <strong>Ending with revision:</strong>
            <CommitSelect id="to" from={false} />
          </Col>
        </Row>
        )}
        {onClick && buttonTitle && <Row className="mt-4 clearfix"><Col lg="12"><Button variant="success" onClick={onClick} className="float-right">{buttonTitle}</Button></Col></Row>}
        <Row className="results">
          <Col>
            <DiffOverview docu={docuId} proofreadingReq={proofreadingReq} />
          </Col>
        </Row>
        {onClick && buttonTitle && <Row className="mt-4 clearfix"><Col lg="12"><Button variant="success" onClick={onClick} className="float-right">{buttonTitle}</Button></Col></Row>}
      </div>
    );
  }
}

DiffWrapper.defaultProps = {
  docuEmpty: false,
  proofreadingReq: null,
  buttonTitle: '',
  onClick: null,
};

DiffWrapper.propTypes = {
  docuId: PropTypes.number.isRequired,
  docuEmpty: PropTypes.bool,
  buttonTitle: PropTypes.string,
  onClick: PropTypes.func,
  proofreadingReq: PropTypes.shape(ProofreadingRequest.getShape()),
};

const mapStateToProps = (state) => ({ docuId: state.docuId, docuEmpty: state.docuEmpty });

export default hot(module)(connect(mapStateToProps)(DiffWrapper));
