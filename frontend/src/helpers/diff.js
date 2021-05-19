import { markdownDiff } from 'markdown-diff';
import lodash from 'lodash';
import ky from 'ky';
import matter from 'front-matter';
import { store } from '../store';

/**
 * Replaces the useBaseUrl with the predefined base. Should probably
 * get the information from docusaurus in the future.
 * @param {string} markdown the page content
 * @returns {string} the modified content
 */
export function docusaurusBaseImages(markdown) {
  // Replace useBaseUrl; base = static
  return markdown.replace(/\{[\s]*useBaseUrl\([\s]*["'](.*?)["'][\s]*\)[\s]*\}/gimu, '"/static/$1"');
}

/**
 * Changes the url of the HTML images to our url, so that
 * we can load the images properly.
 * @param {number} docuId the documentation id
 * @param {string} from the from commit identifier
 * @param {string} to the to commit identifier
 * @param {string} markdown the page content
 * @returns {string} the modified content
 */
export function htmlImages(docuId, from, to, markdown) {
  const state = store.getState();

  const { token } = state;

  // Replace url with our API url; if not relative to domain, keep it
  const url = `src="${window.env.api.backend}/documentations/${docuId}/${to}/${token}/blobs/`;
  let clean = markdown.replace(/(<img.*?)src=["'](?!http|\/\/)[/]?(.*?["'])/gimu, `$1${url}$2`);

  // Replace old version with old version links
  const reg = new RegExp(`(<del.*?src=["'].*?)/${to}/(.*?["'].*?/del>)`, 'gimu');
  clean = clean.replace(reg, `$1/${from}/$2`);

  return clean;
}

/**
 * Changes the url of the Markdown images to our url, so that
 * we can load the images properly.
 * @param {number} docuId the documentation id
 * @param {string} from the from commit identifier
 * @param {string} to the to commit identifier
 * @param {string} markdown the page content
 * @returns {string} the modified content
 */
function markdownImages(docuId, from, to, markdown) {
  // Replace url with our API url; if not relative to domain, keep it
  const url = `/api/documentations/${docuId}/${to}/blobs/`;
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

/**
 * Removes the imports and frontmatter to render the page
 * @param {string} original the original page content
 * @param {string} modified the modified page content
 * @returns {string} the modified content
 */
function removeDocusaurusInfo(original, modified) {
  const originalMatter = matter(original);
  const modifiedMatter = matter(modified);
  let ori = original.replace(/---.*---/s, '');
  let mod = modified.replace(/---.*---/s, '');

  // TODO: Fix this import stuff...
  ori = ori.replace(/\s*import.*docusaurus.*[;]?/, '');

  mod = mod.replace(/\s*import.*docusaurus.*[;]?/, '');
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

/**
 * Runs the diff algorith given the revision info, original
 * and modified contents with optional configuration.
 * @param {Object} revisionInfo the complete revision info as stored in the global state
 * @param {string} original the original page content
 * @param {string} modified the modified page content
 * @param {Object} [opts = {hideCode: true, skipImages: true}] The configuration options
 * @returns
 */
export default async function diff(revisionInfo, original, modified, opts) {
  const options = {
    hideCode: true, skipImages: true, ...opts,
  };

  const changeBadges = [];
  const cleanDocs = removeDocusaurusInfo(original, modified);

  if (cleanDocs.changed) {
    changeBadges.push({
      title: 'Front matter changed',
      description: 'The frontmatter, which is not visible in the rendered content, has changed.',
      variant: 'info',
      id: 'fm',
    });
  }

  const orig = cleanDocs.original;
  const mod = cleanDocs.modified;

  let res;

  if (orig.length > 0) {
    res = markdownDiff(orig, mod, false);
  } else {
    res = `${mod}`;
  }

  // If code should be hidden, hide it. Use regex to try and find changes inside the code block
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

  const response = await ky.post(`${window.env.api.render}/render`, { json: { content: res } });

  if (!changeBadges.length) {
    changeBadges.push({
      title: 'No invisible changes',
      description: 'There are no changes in the frontmatter, which is not visible in the rendered page.',
      variant: 'secondary',
      id: 'no',
    });
  }

  try {
    const content = await response.json();
    return { content: content.rendered, badges: changeBadges, newFile: !orig.length };
  } catch (error) {
    return { content: error, badges: changeBadges, newFile: !orig.length };
  }
}
