/**
 * This transforms branch data returned by Gitlab into a unified format
 * @param {Object} version Branch object returned by Gitlab
 */
export function versionTransformer(version) {
  if (!version) return null;
  return {
    name: version.name || null,
    default: version.default || null,
    haveAccess: version.can_push || null,
  };
}

/**
 * This transforms user data returned by Gitlab into a unified format
 * @param {Object} version Branch object returned by Gitlab
 */
export function userTransformer(user) {
  if (!user) return null;
  return { name: user.name || null, username: user.username || null, id: user.id || null };
}

/**
 * This transforms revision data returned by Gitlab into a unified format
 * @param {Object} revision Revision object returned by Gitlab
 */
export function revisionTransformer(revision) {
  if (!revision) return null;
  return {
    id: revision.id || null,
    shortId: revision.short_id || null,
    title: revision.title || null,
    message: revision.message || null,
    created: revision.created_at || null,
    author: {
      name: revision.author_name || null,
      email: revision.author_email || null,
    },
  };
}

/**
 * This transforms change data returned by Gitlab into a unified format
 * @param {Object} change Change object returned by Gitlab
 */
export function changesTransformer(change) {
  if (!change) return null;
  const ext = change.new_path ? change.new_path.split('.').pop() : '';

  if (change.deleted_file || (ext.toLowerCase() !== 'md' && ext.toLowerCase() !== 'mdx')) {
    return null;
  }

  return {
    oldFile: change.old_path || null,
    newFile: change.new_path || null,
    renamed: typeof change.renamed_file === 'boolean' ? change.renamed_file : null,
  };
}

/**
 * This transforms repository data returned by Gitlab into a unified format
 * @param {Object} repo Repo object returned by Gitlab
 */
export function repositoryTransformer(repo) {
  if (!repo) return null;
  return {
    providerId: repo.id || null,
    name: repo.name || null,
    slug: repo.path || null,
    description: repo.description || null,
  };
}

/**
 * This transforms the tree object returned by Gitlab into a unified format
 * @param {Object} treeObj Tree object returned by Gitlab
 */
export function repositoryTreeTransformer(treeObj) {
  if (!treeObj) return null;
  if (!treeObj.path || treeObj.path.endsWith('.gitkeep')) return null; // We don't want to see .gitkeep files
  return {
    path: treeObj.path || null,
    dir: treeObj.type === 'tree',
  };
}

/**
 * This transforms merge request data returned by Gitlab into a unified format
 * @param {Object} mergeReq Merge request object returned by Gitlab
 */
export function mergeRequestTransformer(mergeReq) {
  if (!mergeReq) return null;
  return {
    id: mergeReq.id || null,
    iid: mergeReq.iid || null,
    projectId: mergeReq.project_id || null,
    title: mergeReq.title || null,
    description: mergeReq.description || null,
    state: mergeReq.state || null,
    targetBranch: mergeReq.target_branch || null,
    sourceBranch: mergeReq.source_branch || null,
    hasConflicts: mergeReq.has_conflicts || null,
    changesCount: mergeReq.changes_count || null,
  };
}
