import '@toast-ui/editor/dist/toastui-editor.css';
import 'codemirror/lib/codemirror.css';
import PropTypes from 'prop-types';
import React from 'react';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { documentationSelected, logOut, pageAutosaveRemove } from '../actions';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';
import EditPage from './EditPage';

const ProofreadingEditPage = ({
  docuId, version, from, to, file, reqId,
}) => {
  const markAsModified = () => {
    secureKy().put(`${window.env.api.backend}/proofreading/${reqId}/pages/${encodeURIComponent(file)}`).json();
  };
  return <EditPage docuId={docuId} version={version} from={from} to={to} file={file} onSave={markAsModified} />;
};

export default ProofreadingEditPage;
