const visit = require('unist-util-visit');
// const squeezeParagraphs = require('mdast-squeeze-paragraphs');

const types = ['code', 'image'];

const { splice } = [];

function visitor(node, index, parent) {
  const siblings = parent.children;

  splice.apply(siblings, [index, 1].concat(node.children || []));

  return index;
}

function transformer(tree) {
  visit(tree, types, visitor);
}

function removeBlocks() {
  return transformer;
}

module.exports = removeBlocks;
