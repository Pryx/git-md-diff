import { markdownDiff } from 'markdown-diff';

const remark = require('remark');

const html = require('remark-html');

const removeBlocks = require('./removeBlocks.js');

function imagePlaceholders(markdown) {
  const clean = markdown.replace(/src={useBaseUrl.*}/g, 'src="http://via.placeholder.com/200?text=IMAGE"');
  return clean;
}

function removeDocusaurusInfo(markdown) {
  let clean = markdown.replace(/---.*title: ([^\n]*).*---/s, '# Title: $1');
  clean = clean.replace(/\s*import.*docusaurus.*;/, '');

  return clean;
}

export default function diff(original, modified) {
  let originalClean = removeDocusaurusInfo(original);
  let modifiedClean = removeDocusaurusInfo(modified);
  originalClean = imagePlaceholders(originalClean);
  modifiedClean = imagePlaceholders(modifiedClean);

  const res = markdownDiff(originalClean, modifiedClean);

  // var markdown = require('remark-parse')

  const parser = remark()
    .use(removeBlocks)
    .use(html);

  let result = parser().processSync(res).contents;

  result = result.replace(/<del>/g, '<del style="color:#a33;background:#ffeaea;text-decoration:line-through;">');
  result = result.replace(/<ins>/g, '<ins style="color:darkgreen;background:#eaffea;">');

  return result;
}
