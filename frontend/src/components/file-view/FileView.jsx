import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import PropTypes from 'prop-types';
import DirItem from './DirItem';

/**
 * The root file view
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
