import '@toast-ui/editor/dist/toastui-editor.css';
import 'codemirror/lib/codemirror.css';
import PropTypes from 'prop-types';
import React from 'react';
import { secureKy } from '../entities/secure-ky';
import EditPage from './EditPage';

const ProofreadingEditPage = ({
  docuId, version, from, to, file, reqId,
}) => {
  const markAsModified = () => {
    secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/pages/${encodeURIComponent(file)}`).json();
  };
  return <EditPage docuId={docuId} version={version} from={from} to={to} file={file} onSave={markAsModified} />;
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
