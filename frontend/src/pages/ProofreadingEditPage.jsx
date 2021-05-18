import '@toast-ui/editor/dist/toastui-editor.css';
import 'codemirror/lib/codemirror.css';
import PropTypes from 'prop-types';
import React from 'react';
import { Breadcrumb, Col, Row } from 'react-bootstrap';
import { Link } from 'wouter';
import EditorWrapper from '../components/editor/EditorWrapper';
import { secureKy } from '../helpers/secure-ky';

/**
 * This is a modified edit page to account for the different breadcrumb
 * structure and the proofreading request diff
 * @param {*} props The React props
 * @returns the react component
 */
const ProofreadingEditPage = ({
  docuId, version, from, to, file, reqId,
}) => {
  const markAsModified = () => {
    secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/pages/${file}`).json();
  };
  return (
    <div className="editor-wrap">
      <Row className="mt-3 mr-3 ml-3">
        <Col>
          <Breadcrumb>
            <Link to="/">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
            </Link>
            <Link to={`/documentation/${docuId}`}>
              <Breadcrumb.Item>
                Documentation
                {' '}
                {docuId}
              </Breadcrumb.Item>
            </Link>
            <Link to={`/documentation/${docuId}/proofreading/${reqId}`}>
              <Breadcrumb.Item>
                Proofreading request
                {' '}
                {reqId}
              </Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>
              <strong>Edit file</strong>
              {' '}
              {decodeURIComponent(file)}
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
      <EditorWrapper
        docuId={docuId}
        version={version}
        from={from}
        to={to}
        file={file}
        onSave={markAsModified}
      />
    </div>

  );
};

ProofreadingEditPage.propTypes = {
  docuId: PropTypes.number.isRequired,
  reqId: PropTypes.number.isRequired,
  from: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
};

export default ProofreadingEditPage;
