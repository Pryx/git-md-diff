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
import Change from '../../shapes/change';

/**
 * Diff wrapper component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits.
 */
class DiffWrapper extends React.Component {
  state = {
    error: null,
  };

  render() {
    const { error } = this.state;

    const {
      docuId, docuEmpty, onClick, excludedChanges, changes,
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

    const showBtns = filteredChanges.length !== 0 && onClick;
    const showAlert = changes.length !== 0 && filteredChanges.length === 0;

    return (
      <div className="diff">
        <Row className="select-diff mt-4">
          <Col>
            <strong>To revision:</strong>
            <CommitSelect id="to" from={false} />
          </Col>
        </Row>
        <Row className="select-diff mt-4">
          <Col>
            <strong>From revision:</strong>
            <CommitSelect id="from" from />
          </Col>
        </Row>
        {showAlert && (
          <Alert variant="info" className="mt-4">
            You need to select at least one file to be able to create a new proofreading request.
          </Alert>
        )}
        {showBtns && (
          <Row className="mt-4 clearfix">
            <Col lg="12">
              <Button variant="success" onClick={onClick} className="float-right">Create proofreading request</Button>
            </Col>
          </Row>
        )}
        <Row className="results">
          <Col>
            <DiffOverview docu={docuId} />
          </Col>
        </Row>
        {showBtns && <Row className="mt-4 clearfix"><Col lg="12"><Button variant="success" onClick={onClick} className="float-right">Create proofreading request</Button></Col></Row>}
      </div>
    );
  }
}

DiffWrapper.defaultProps = {
  docuEmpty: false,
  onClick: null,
  changes: [],
  excludedChanges: [],
};

DiffWrapper.propTypes = {
  docuId: PropTypes.number.isRequired,
  docuEmpty: PropTypes.bool,
  onClick: PropTypes.func,
  changes: PropTypes.arrayOf(PropTypes.shape(Change)),
  excludedChanges: PropTypes.arrayOf(PropTypes.string),
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  docuEmpty: state.docuEmpty,
  changes: state.changes,
  excludedChanges: state.excludedChanges,
});

export default hot(module)(connect(mapStateToProps)(DiffWrapper));
