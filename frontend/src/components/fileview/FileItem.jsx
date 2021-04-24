import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'wouter';
import { connect } from 'react-redux';
import { hot } from 'react-hot-loader';

const FileItem = ({
  name, path, docuId, version,
}) => {
  if (name.endsWith('.md') || name.endsWith('.mdx')) {
    return (
      <div className="file">
        <i className="fas fa-file-alt" />
        {' '}
        <Link href={`/documentation/${docuId}/edit/v/${version}/f/${path}`}>{name}</Link>
      </div>
    );
  }
  return (
    <div className="file">
      <i className="fas fa-file" />
      {' '}
      <span>{name}</span>
    </div>
  );
};

FileItem.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  docuId: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  version: state.endRevision ? state.endRevision.branch : '',
});

export default hot(module)(connect(mapStateToProps)(FileItem));
