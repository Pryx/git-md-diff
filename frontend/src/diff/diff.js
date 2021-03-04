import { markdownDiff } from 'markdown-diff';

const marked = require('marked');
const matter = require('front-matter');

function imagePlaceholders(repository, from, to, markdown) {
  const inserts = markdown.matchAll(/<ins.*?src={useBaseUrl\('(.*)'\)}.*\/ins>/g);
  let clean = markdown;

  if (inserts) {
    [...inserts].map((m) => m[1]).forEach((elem) => {
      clean = clean.replace(`src={useBaseUrl('${elem}')}`, `src="/api/${repository}/file/${encodeURIComponent(`static/${elem}`)}/${to}/raw"`);
    });
  }

  const deletes = markdown.matchAll(/<del.*?src={useBaseUrl\('(.*)'\)}.*\/del>/g);

  if (deletes) {
    [...deletes].map((m) => m[1]).forEach((elem) => {
      clean = clean.replace(`src={useBaseUrl('${elem}')}`, `src="/api/${repository}/file/${encodeURIComponent(`static/${elem}`)}/${from}/raw"`);
    });
  }

  const rest = markdown.matchAll(/src={useBaseUrl\('(.*)'\)}/g);

  if (rest) {
    [...rest].map((m) => m[1]).forEach((elem) => {
      clean = clean.replace(`src={useBaseUrl('${elem}')}`, `src="/api/${repository}/file/${encodeURIComponent(`static/${elem}`)}/${to}/raw"`);
    });
  }

  return clean;
}

function removeDocusaurusInfo(original, modified) {
  const original_matter = matter(original);
  const modified_matter = matter(modified);
  let ori = original.replace(/---.*---/s, '');
  let mod = modified.replace(/---.*---/s, '');

  ori = ori.replace(/\s*import.*docusaurus.*;/, '');

  mod = mod.replace(/\s*import.*docusaurus.*;/, '');
  if (original_matter.attributes.title) {
    ori = `# Title: ${original_matter.attributes.title}\n${ori}`;
  }

  if (modified_matter.attributes.title) {
    mod = `# Title: ${modified_matter.attributes.title}\n${mod}`;
  }

  return { original: ori, modified: mod, changed: !shallowEqual(original_matter.attributes, modified_matter.attributes) };
}

function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}

export default function diff(revisionInfo, original, modified, opts) {
  const options = {
    hideCode: true, debug: false, skipImages: true, ...opts,
  };

  const invisible_changes = [];
  const cleanDocs = removeDocusaurusInfo(original, modified);
  if (cleanDocs.changed) {
    invisible_changes.push('Front matter changed');
  }
  /* originalClean = imagePlaceholders(originalClean);
  modifiedClean = imagePlaceholders(modifiedClean); */
  let orig = cleanDocs.original;
  let mod = cleanDocs.modified;
  let res;

  if (orig.length > 0) {
    res = markdownDiff(orig, mod, true);
  } else {
    res = `<div class="new-file">\n${mod}</div>`;
  }

  if (!options.skipImages){
    res = imagePlaceholders(revisionInfo.repo, revisionInfo.from, revisionInfo.to, res);
  }
  

  const renderer = {};
  if (options.hideCode) {
    renderer.code = (code, infostring, escaped) => {
      if (code.indexOf('<ins') || code.indexOf('<del')) {
        return '<pre class="changed"><code>Code block changed</code></pre>';
      }
      return '<pre><code>Code block</code></pre>';
    };
  }

  marked.use({ renderer });
  if (options.debug) {
    return { content: `${marked(res)}<pre>${orig}</pre><pre>${mod}</pre>`, invisible: invisible_changes };
  }
  return { content: marked(res), invisible: invisible_changes };
}
