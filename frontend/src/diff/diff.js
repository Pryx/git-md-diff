import { markdownDiff } from 'markdown-diff';
import lodash from 'lodash';

const matter = require('front-matter');

function docusaurusBaseImages(markdown) {
  // Replace useBaseUrl; base = static
  return markdown.replace(/\{[\s]*useBaseUrl\([\s]*["'](.*?)["'][\s]*\)[\s]*\}/gimu, '"/static/$1"');
}

function htmlImages(repository, from, to, markdown) {
  // Replace url with our API url; if not relative to domain, keep it
  const url = `src="/api/documentations/${repository}/${to}/blobs/`;
  let clean = markdown.replace(/(<img.*?)src=["'](?!http|\/\/)(.*?["'])/gimu, `$1${url}$2`);

  // Replace old version with old version links
  const reg = new RegExp(`(<del.*?src=["'].*?)/${to}/(.*?["'].*?/del>)`, 'gimu');
  clean = clean.replace(reg, `$1/${from}/$2`);

  return clean;
}

function markdownImages(repository, from, to, markdown) {
  // Replace url with our API url; if not relative to domain, keep it
  const url = `/api/documentations/${repository}/${to}/blobs/`;
  let clean = markdown.replace(/(!\[.*?\]\()(.*?\))/gimu, `$1${url}$2`);

  // Replace old version with old version links
  const reg = new RegExp(`(<del.*?![.*?].*?)/${to}/(.*?/del>)`, 'gimu');
  clean = clean.replace(reg, `$1/${from}/$2`);

  // Appease the MDX lord, that just needs to have a special syntax requirements
  // <del>![AAA](AAA)</del> => <del>\n\n![AAA](AAA)\n\n</del>
  clean = clean.replace(/<del>(.*?!\[.*?\].*?)<\/del>/gimu, '<del>\n\n$1\n\n</del>');
  clean = clean.replace(/<ins>(.*?!\[.*?\].*?)<\/ins>/gimu, '<ins>\n\n$1\n\n</ins>');
  return clean;
}

function removeDocusaurusInfo(original, modified) {
  const originalMatter = matter(original);
  const modifiedMatter = matter(modified);
  let ori = original.replace(/---.*---/s, '');
  let mod = modified.replace(/---.*---/s, '');

  ori = ori.replace(/\s*import.*docusaurus.*;/, '');

  mod = mod.replace(/\s*import.*docusaurus.*;/, '');
  if (originalMatter.attributes.title) {
    ori = `# Title: ${originalMatter.attributes.title}\n${ori}`;
  }

  if (modifiedMatter.attributes.title) {
    mod = `# Title: ${modifiedMatter.attributes.title}\n${mod}`;
  }

  return {
    original: ori,
    modified: mod,
    changed: !lodash.isEqual(originalMatter.attributes, modifiedMatter.attributes),
  };
}

export default async function diff(revisionInfo, original, modified, opts) {
  const options = {
    hideCode: true, skipImages: true, ...opts,
  };

  const invisibleChanges = [];
  const cleanDocs = removeDocusaurusInfo(original, modified);

  if (cleanDocs.changed) {
    invisibleChanges.push({ text: 'Front matter changed', variant: 'info', id: 'fm' });
  }

  const orig = cleanDocs.original;
  const mod = cleanDocs.modified;
  let res;

  if (orig.length > 0) {
    res = markdownDiff(orig, mod, false);
  } else {
    res = `${mod}`;
  }

  // (```[\sa-z]*\n[\s\S]*?\n```)
  if (options.hideCode) {
    const codeblocks = [...res.matchAll(/(```[\sa-z]*?\n?[\s\S]*?\n?```)/gm)].map((m) => m[1]);
    if (codeblocks) {
      codeblocks.forEach((codeblock) => {
        if (codeblock.includes('<del') || codeblock.includes('<ins')) {
          res = res.replace(codeblock, '<pre><code>Code block changed</code></pre>');
        } else {
          res = res.replace(codeblock, '<pre><code>Code block</code></pre>');
        }
      });
    }
  }

  res = docusaurusBaseImages(res);
  res = htmlImages(revisionInfo.docuId, revisionInfo.from, revisionInfo.to, res);
  res = markdownImages(revisionInfo.docuId, revisionInfo.from, revisionInfo.to, res);

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: res,
    }),
  };

  const response = await fetch('/api/render', requestOptions);

  if (!invisibleChanges.length) {
    invisibleChanges.push({ text: 'No invisible changes', variant: 'secondary', id: 'no' });
  }

  try {
    const content = await response.json();
    return { content: content.rendered, invisible: invisibleChanges, newFile: !orig.length };
  } catch (error) {
    return { content: error, invisible: invisibleChanges, newFile: !orig.length };
  }
}
