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
import Change from '../entities/change';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DiffWrapper extends React.Component {
  state = {
    error: null,
    disableNew: false,
  };

  render() {
    const { error, disableNew } = this.state;

    const {
      docuId, docuEmpty, proofreadingReq, onClick, buttonTitle,
      noChangesMessage, excludedChanges, changes,
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

    const flatChanges = changes.map((c) => c.newFile);
    const filteredChanges = flatChanges.filter((c) => excludedChanges.indexOf(c) === -1);

    const showBtns = filteredChanges.length !== 0 && onClick && buttonTitle;
    const showAlert = changes.length !== 0 && filteredChanges.length === 0 && !proofreadingReq;

    return (
      <div className="diff">
        {!proofreadingReq && (
          <Row className="select-diff mt-4">
            <Col lg={6} xs={12}>
              <strong>Original content:</strong>
              <CommitSelect id="from" from />
            </Col>
            <Col lg={6} xs={12}>
              <strong>Modified content:</strong>
              <CommitSelect id="to" from={false} />
            </Col>
          </Row>
        )}
        {showAlert && (
        <Alert variant="info" className="mt-4">
          You need to select at least one file to be able to create a new proofreading request.
        </Alert>
        )}
        {showBtns && (
        <Row className="mt-4 clearfix">
          <Col lg="12">
            <Button variant="success" onClick={onClick} className="float-right" disabled={disableNew}>{buttonTitle}</Button>
          </Col>
        </Row>
        )}
        <Row className="results">
          <Col>
            { noChangesMessage
              && (
              <DiffOverview
                docu={docuId}
                proofreadingReq={proofreadingReq}
                noChangesMessage={noChangesMessage}
              />
              )}
            { !noChangesMessage
              && <DiffOverview docu={docuId} proofreadingReq={proofreadingReq} />}
          </Col>
        </Row>
        {showBtns && <Row className="mt-4 clearfix"><Col lg="12"><Button variant="success" onClick={onClick} className="float-right" disabled={disableNew}>{buttonTitle}</Button></Col></Row>}
      </div>
    );
  }
}

DiffWrapper.defaultProps = {
  docuEmpty: false,
  proofreadingReq: null,
  buttonTitle: '',
  onClick: null,
  noChangesMessage: null,
  changes: [],
  excludedChanges: [],
};

DiffWrapper.propTypes = {
  docuId: PropTypes.number.isRequired,
  docuEmpty: PropTypes.bool,
  buttonTitle: PropTypes.string,
  onClick: PropTypes.func,
  proofreadingReq: PropTypes.shape(ProofreadingRequest.getShape()),
  noChangesMessage: PropTypes.string,
  changes: PropTypes.arrayOf(PropTypes.shape(Change.getShape())),
  excludedChanges: PropTypes.arrayOf(PropTypes.string),
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  docuEmpty: state.docuEmpty,
  changes: state.changes,
  excludedChanges: state.excludedChanges,
});

export default hot(module)(connect(mapStateToProps)(DiffWrapper));
