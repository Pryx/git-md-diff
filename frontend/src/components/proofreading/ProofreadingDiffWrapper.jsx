import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, OverlayTrigger, Tab, Tabs, Tooltip,
} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { proofreadingStates } from '../../constants/proofreading-states';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import ProofreadingRequest from '../../shapes/proofreading-request';
import DiffOverview from '../diff/DiffOverview';

/**
 * Proofreading diff wrapper is a wrapper to diff overview and commit selectors.
 * Handles the buttons and the accept/reject/submit processes.
 */
class ProofreadingDiffWrapper extends React.Component {
  state = {
    error: null,
    success: null,
  };

  constructor(props) {
    super(props);
    this.submitProofread = this.submitProofread.bind(this);
    this.merge = this.merge.bind(this);
    this.reject = this.reject.bind(this);
  }

  /**
   * Marks the proofreading request as completed
   * @param {Event} e The JS event
   */
  submitProofread(e) {
    e.preventDefault();
    const { proofreadingReq } = this.props;
    const reqId = proofreadingReq.id;

    const resolveReq = async () => {
      await secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/submit`).json();

      this.setState({
        success: 'Successfully submitted your changes',
        error: null,
      });
    };

    resolveReq().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        success: null,
        error: errorMessage,
      });
    });
  }

  /**
   * Merges the completed proofreading request
   * @param {Event} e The JS event
   */
  merge(e) {
    e.preventDefault();
    const { proofreadingReq } = this.props;
    const reqId = proofreadingReq.id;
    const mergeReq = async () => {
      await secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/merge`).json();

      this.setState({
        success: 'Successfully merged proofread version!',
        error: null,
      });
    };

    mergeReq().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        success: null,
        error: errorMessage,
      });
    });
  }

  /**
   * Rejectss the completed proofreading request
   * @param {Event} e The JS event
   */
  reject(e) {
    e.preventDefault();
    const { proofreadingReq } = this.props;
    const reqId = proofreadingReq.id;
    const rejectReq = async () => {
      await secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/reject`).json();

      this.setState({
        success: 'The proofreading request was returned for further proofreading.',
        error: null,
      });
    };

    rejectReq().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        success: null,
        error: errorMessage,
      });
    });
  }

  render() {
    const { error, success } = this.state;

    const {
      proofreadingReq,
      proofreader,
    } = this.props;

    const onClick = proofreader ? this.submitProofread : this.merge;

    const from = proofreadingReq.revFrom;
    const to = proofreadingReq.revTo;
    const fromProofreader = proofreadingReq.revTo;
    const toProofreader = proofreadingReq.sourceBranch;
    const version = proofreadingReq.sourceBranch;

    let buttonTitle = '';
    let alert = null;
    if (proofreader) {
      if ((proofreadingReq.state === proofreadingStates.new
        || proofreadingReq.state === proofreadingStates.inprogress
        || proofreadingReq.state === proofreadingStates.rejected) && !success) {
        buttonTitle = 'Mark as complete';
      }

      if (!buttonTitle.length) {
        alert = <Alert variant="info">Submitted for approval, no additional changes possible at this time</Alert>;
      }
    } else {
      buttonTitle = !success ? 'Merge' : '';
    }

    if (error) {
      alert = (
        <Alert variant="danger" className="mt-5">
          {error.toString()}
        </Alert>
      );
    } else if (success) {
      alert = (
        <Alert variant="success" className="mt-5">
          {success}
        </Alert>
      );
    }

    // Disable if no changes
    const disable = proofreadingReq.state !== proofreadingStates.submitted && !proofreader;

    let buttons = null;

    if (buttonTitle.length) {
      if (disable) {
        buttons = (
          <Row className="mt-4 mb-4 clearfix">
            <Col lg="6">
              <OverlayTrigger overlay={(
                <Tooltip>
                  You cannot reject these changes yet, as the proofreading
                  request is not marked as completed yet.
                </Tooltip>
              )}
              >
                <div className="float-left">
                  <Button
                    variant="danger"
                    onClick={onClick}
                    className="disabled"
                    disabled
                  >
                    Reject
                  </Button>
                </div>
              </OverlayTrigger>
            </Col>
            <Col lg="6">
              <OverlayTrigger
                trigger="click"
                overlay={(
                  <Tooltip>
                    You cannot merge these changes yet, as the proofreading
                    request is not marked as completed yet.
                  </Tooltip>
              )}
              >
                <div className="float-right">
                  <Button
                    variant="success"
                    onClick={onClick}
                    className="disabled"
                    disabled
                  >
                    {buttonTitle}
                  </Button>
                </div>
              </OverlayTrigger>
            </Col>
          </Row>
        );
      } else if (proofreader) {
        buttons = (
          <Row className="mt-4 mb-4 clearfix">
            <Col lg="12">
              <Button variant="success" onClick={onClick} className="float-right" disabled={disable}>
                {buttonTitle}
              </Button>
            </Col>
          </Row>
        );
      } else {
        buttons = (
          <Row className="mt-4 mb-4 clearfix">
            <Col lg="6">
              <Button
                variant="danger"
                onClick={this.reject}
              >
                Reject
              </Button>
            </Col>
            <Col lg="6">
              <Button
                variant="success"
                onClick={onClick}
                className="float-right"
              >
                {buttonTitle}
              </Button>
            </Col>
          </Row>
        );
      }
    }

    return (
      <div className="diff">
        {alert}
        <div>
          {buttons}
        </div>
        <Row className="results">
          <Col>
            <Tabs defaultActiveKey="requested" id="docutabs">
              <Tab eventKey="requested" title="Changes requested to proofread">
                <DiffOverview
                  proofreadingReq={proofreadingReq}
                  proofreader={false}
                  from={from}
                  to={to}
                  version={version}
                />
              </Tab>
              <Tab eventKey="proofreader" title="Proofreader's changes">
                <DiffOverview
                  proofreadingReq={proofreadingReq}
                  noChangesMessage="The proofreader has made no changes."
                  proofreader
                  from={fromProofreader}
                  to={toProofreader}
                  version={version}
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
        {buttons}
      </div>
    );
  }
}

ProofreadingDiffWrapper.defaultProps = {
  proofreadingReq: null,
  proofreader: true,
};

ProofreadingDiffWrapper.propTypes = {
  proofreadingReq: PropTypes.shape(ProofreadingRequest),
  proofreader: PropTypes.bool,
};

export default hot(module)(ProofreadingDiffWrapper);
