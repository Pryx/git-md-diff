export function versionTransformer(version) {
  return { name: version.name, default: version.default };
}

export function revisionTransformer(revision) {
  return {
    id: revision.id,
    shortId: revision.short_id,
    title: revision.title,
    message: revision.message,
    created: revision.created_at,
    author: {
      name: revision.author_name,
      email: revision.author_email,
    },
  };
}

export function changesTransformer(change) {
  const ext = change.new_path.split('.').pop();

  if (change.deleted_file || (ext.toLowerCase() !== 'md' && ext.toLowerCase() !== 'mdx')) {
    return null;
  }

  return {
    oldFile: change.old_path,
    newFile: change.new_path,
    renamed: change.renamed_file,
  };
}

export function repositoryTransformer(repo) {
  return {
    id: repo.id,
    name: repo.name,
    slug: repo.path,
    description: repo.description,
  };
}

export function repositoryTreeTransformer(treeObj) {
  if (treeObj.path.endsWith('.gitkeep')) return null; // We don't want to see .gitkeep files
  return {
    path: treeObj.path,
    dir: treeObj.type === 'tree',
  };
}


export function mergeRequestTransformer(mergeReq) {
  return {
    id: mergeReq.id,
    iid: mergeReq.iid,
    projectId: mergeReq.project_id,
    title: mergeReq.title,
    description: mergeReq.description,
    state: mergeReq.state,
    targetBranch: mergeReq.target_branch,
    sourceBranch: mergeReq.source_branch,
    hasConflicts: mergeReq.has_conflicts,
    changesCount: mergeReq.changes_count,
  };
}
