import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'wouter';
import { connect } from 'react-redux';
import { hot } from 'react-hot-loader';

const FileItem = ({ name, path, docuId }) =>{
  if (name.endsWith(".md") || name.endsWith(".mdx")){
    return (
      <div className="file">
        <Link href={`/documentation/${docuId}/edit/${encodeURIComponent(path)}`}>{name}</Link>
      </div>
    );
  }
  return (
    <div className="file">
      <span>{name}</span>
    </div>
  );
}

FileItem.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
});

export default hot(module)(connect(mapStateToProps)(FileItem));
