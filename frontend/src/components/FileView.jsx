import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import PropTypes from 'prop-types';
import DirItem from './fileview/DirItem';

/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
const FileView = ({ docuId, version }) => (
  <Row className="mt-3">
    <Col lg={12}>
      <DirItem name="/" path="" openState docuId={docuId} version={version} />
    </Col>
  </Row>
);

FileView.propTypes = {
  docuId: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
};

export default hot(module)(FileView);
