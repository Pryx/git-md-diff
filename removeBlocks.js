'use strict'

var visit = require('unist-util-visit')
var squeezeParagraphs = require('mdast-squeeze-paragraphs')

var types = ['code', 'image']

var splice = [].splice

module.exports = removeBlocks

function removeBlocks() {
  return transformer
}

function transformer(tree) {
  visit(tree, types, visitor)}

function visitor(node, index, parent) {
  var siblings = parent.children

  splice.apply(siblings, [index, 1].concat(node.children || []))

  return index
}