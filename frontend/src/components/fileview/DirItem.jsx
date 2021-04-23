import React from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';

const DirItem = ({ name, children }) => (
  <div className="folder-wrap mt-2 mb-2">
    <div className="folder-label">
      <strong>{name}</strong>
    </div>
    <div className="folder-children">{children}</div>
  </div>
);

DirItem.defaultProps = {
  children: null
}

DirItem.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

export default hot(module)(DirItem);
