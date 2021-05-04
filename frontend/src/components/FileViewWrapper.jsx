import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import CommitSelect from './CommitSelect';
import FileView from './FileView';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class FileViewWrapper extends React.Component {
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
        <Alert variant="info mt-4">This documentation is empty. You should initialize this repository with your Docusaurus installation.</Alert>
      );
    }

    return (
      <div className="edit">
        <Row className="select-edit-version mt-4">
          <Col>
            <strong>Documentation revision:</strong>
            <CommitSelect id="to" from={false} includeCommits={false} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <FileView docu={docuId} />
          </Col>
        </Row>
      </div>
    );
  }
}

FileViewWrapper.defaultProps = {
  docuEmpty: false,
};

FileViewWrapper.propTypes = {
  docuId: PropTypes.number.isRequired,
  docuEmpty: PropTypes.bool,
};

const mapStateToProps = (state) => ({ docuId: state.docuId, docuEmpty: state.docuEmpty });

export default hot(module)(connect(mapStateToProps)(FileViewWrapper));
