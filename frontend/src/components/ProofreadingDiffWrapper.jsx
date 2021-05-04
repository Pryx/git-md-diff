import PropTypes from 'prop-types';
import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { proofreadingStates } from '../constants/proofreading-states';
import Change from '../entities/change';
import ProofreadingRequest from '../entities/proofreading-request';
import DiffOverview from './DiffOverview';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class ProofreadingDiffWrapper extends React.Component {
  state = {
    error: null,
  };

  render() {
    const { error } = this.state;

    const {
      docuId, proofreadingReq, onClick, buttonTitle, disabledText,
      noChangesMessage, excludedChanges, changes, proofreader,
    } = this.props;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    }

    const flatChanges = changes.map((c) => c.newFile);
    const filteredChanges = flatChanges.filter((c) => excludedChanges.indexOf(c) === -1);

    const showBtns = (!proofreader || filteredChanges.length !== 0)
      && onClick
      && buttonTitle;

    const disable = filteredChanges.length === 0
      && proofreadingReq.state !== proofreadingStates.submitted
      && !proofreader;

    let button = null;

    if (showBtns) {
      if (disable && disabledText) {
        button = (
          <Row className="mt-4 clearfix">
            <Col lg="12">
              <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">{disabledText}</Tooltip>}>
                <Button
                  variant="success"
                  onClick={onClick}
                  className="float-right disabled"
                  disabled={disable}
                >
                  {buttonTitle}
                </Button>
              </OverlayTrigger>
            </Col>
          </Row>
        );
      } else {
        button = (
          <Row className="mt-4 clearfix">
            <Col lg="12">
              <Button variant="success" onClick={onClick} className="float-right" disabled={disable}>
                {buttonTitle}
              </Button>
            </Col>
          </Row>
        );
      }
    }

    return (
      <div className="diff">
        {button}
        <Row className="results">
          <Col>
            {noChangesMessage
              && (
                <DiffOverview
                  docu={docuId}
                  proofreadingReq={proofreadingReq}
                  noChangesMessage={noChangesMessage}
                />
              )}
            {!noChangesMessage
              && <DiffOverview docu={docuId} proofreadingReq={proofreadingReq} />}
          </Col>
        </Row>
        {button}
      </div>
    );
  }
}

ProofreadingDiffWrapper.defaultProps = {
  proofreadingReq: null,
  buttonTitle: '',
  onClick: null,
  noChangesMessage: null,
  changes: [],
  excludedChanges: [],
  proofreader: true,
  disabledText: '',
};

ProofreadingDiffWrapper.propTypes = {
  docuId: PropTypes.number.isRequired,
  buttonTitle: PropTypes.string,
  onClick: PropTypes.func,
  proofreadingReq: PropTypes.shape(ProofreadingRequest.getShape()),
  noChangesMessage: PropTypes.string,
  changes: PropTypes.arrayOf(PropTypes.shape(Change.getShape())),
  excludedChanges: PropTypes.arrayOf(PropTypes.string),
  proofreader: PropTypes.bool,
  disabledText: PropTypes.string,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  changes: state.changes,
  excludedChanges: state.excludedChanges,
});

export default hot(module)(connect(mapStateToProps)(ProofreadingDiffWrapper));
