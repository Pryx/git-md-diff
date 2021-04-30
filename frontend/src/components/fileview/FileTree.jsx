import React from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';
import FileItem from './FileItem';
import DirItem from './DirItem';

const FileTree = ({ data, path }) => {
  if (!data.children.length) {
    return null;
  }

  // loop through the data
  return data.children.map((item) => {
    if (item.dir) {
      return (
        <DirItem key={`${path}${item.name}`} name={item.name}>
          <FileTree data={item} path={`${path}${item.name}/`} />
        </DirItem>
      );
    }
    return <FileItem key={`${path}${item.name}`} name={item.name} path={`${path}${item.name}`} />;
  });
};

FileTree.defaultProps = {
  path: '',
  openState: false,
};

// https://stackoverflow.com/a/58556318
let treeType;
const lazyTreeType = () => treeType;

treeType = {
  path: PropTypes.string,
  dir: PropTypes.bool,
  children: PropTypes.arrayOf(PropTypes.shape(lazyTreeType)),
};

FileTree.propTypes = {
  data: PropTypes.shape(treeType),
  path: PropTypes.string,
};

export default hot(module)(FileTree);
