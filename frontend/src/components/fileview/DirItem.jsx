import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';

const DirItem = ({ name, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const state = isOpen ? 'open' : 'closed';
  const icon = isOpen ? (<i className="fas fa-folder-open" />) : (<i className="fas fa-folder" />);

  return (
    <div className={`folder-wrap mt-2 mb-2 ${state}`}>
      <div className="folder-label" onClick={toggle} role="button" tabIndex="0" onKeyDown={toggle}>
        {icon}
        {' '}
        <strong>{name}</strong>
      </div>
      <div className="folder-children">{children}</div>
    </div>
  );
};

DirItem.defaultProps = {
  children: null,
};

DirItem.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

export default hot(module)(DirItem);
