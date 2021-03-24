export function versionTransformer(version){
  return {name: version.name, default: version.default}
}

export function revisionTransformer(revision){
  return {
    id: revision.id,
    shortId: revision.short_id,
    title: revision.title,
    message: revision.message,
    created: revision.created_at,
    author: {
      name: revision.author_name,
      email: revision.author_email
    }
  }
}

export function changesTransformer(change){
  const ext = change.new_path.split('.').pop();

  if (change.deleted_file || (ext.toLowerCase() != 'md' && ext.toLowerCase() != 'mdx')) {
    return null;
  }
  
  return {
    oldFile: change.old_path,
    newFile: change.new_path,
    renamed: change.renamed_file,
  }
}