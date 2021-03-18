import { markdownDiff } from 'markdown-diff';

const matter = require('front-matter');
function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
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
    changed: !shallowEqual(originalMatter.attributes, modifiedMatter.attributes),
  };
}

export default async function diff(revisionInfo, original, modified, opts) {
  const options = {
    hideCode: true, skipImages: true, ...opts,
  };

  const invisibleChanges = [];
  const cleanDocs = removeDocusaurusInfo(original, modified);

  if (cleanDocs.changed) {
    invisibleChanges.push({text: 'Front matter changed', variant: 'info', id: "fm"});
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
  const codeblocks = [... res.matchAll(/(```[\sa-z]*?\n?[\s\S]*?\n?```)/gm)].map((m) => m[1]);
  if (codeblocks) {
    codeblocks.forEach((codeblock) => {
      if (codeblock.includes('<del') || codeblock.includes('<ins')){
        res = res.replace(codeblock, `<pre><code>Code block changed</code></pre>`);
      }else{
        res = res.replace(codeblock, `<pre><code>Code block</code></pre>`);
      }
    });
  }

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: res,
    }),
  };

  const response = await fetch('/api/render', requestOptions);

  if (!invisibleChanges.length){
    invisibleChanges.push({text: 'No invisible changes', variant: 'secondary', id: "no"});
  }

  try {
    const content = await response.json(); 
    return { content: content.rendered, invisible: invisibleChanges, newFile: !orig.length };
  } catch (error) {
    return { content: error, invisible: invisibleChanges, newFile: !orig.length };
  }
}
