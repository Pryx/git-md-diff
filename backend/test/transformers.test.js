import {
  versionTransformer,
  userTransformer,
  revisionTransformer,
  changesTransformer,
  repositoryTransformer,
  repositoryTreeTransformer,
  mergeRequestTransformer,
} from '../src/transformers/gitlab';

// This is to test the simpler transformers that only rename keys
const bigMixedObject = {
  id: 'id',
  short_id: 'shortId',
  title: 'title',
  message: 'message',
  created_at: 'created',
  author_name: 'name',
  author_email: 'email',
  name: 'name',
  path: 'path',
  description: 'description',
  iid: 'iid',
  state: 'state',
  target_branch: 'targetBranch',
  source_branch: 'sourceBranch',
  has_conflicts: 'hasConflicts',
  changes_count: 'changesCount',
  default: 'default',
  can_push: 'haveAccess',
  username: 'username',
  project_id: 'projectId',
};

describe('Transformer tests', () => {
  it('versionTransformer correctness tests', () => {
    expect(versionTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(versionTransformer({})).toStrictEqual({
      default: null,
      haveAccess: null,
      name: null,
    });

    expect(versionTransformer(bigMixedObject))
      .toStrictEqual(
        {
          default: 'default',
          haveAccess: 'haveAccess',
          name: 'name',
        },
      );
  });

  it('userTransformer correctness tests', () => {
    expect(userTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(userTransformer({})).toStrictEqual({
      id: null,
      name: null,
      username: null,
    });

    expect(userTransformer(bigMixedObject))
      .toStrictEqual(
        {
          id: 'id',
          name: 'name',
          username: 'username',
        },
      );
  });

  it('revisionTransformer correctness tests', () => {
    expect(revisionTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(revisionTransformer({})).toStrictEqual({
      author: {
        email: null,
        name: null,
      },
      created: null,
      id: null,
      message: null,
      shortId: null,
      title: null,
    });

    expect(revisionTransformer(bigMixedObject)).toStrictEqual(
      {
        author: {
          email: 'email',
          name: 'name',
        },
        created: 'created',
        id: 'id',
        message: 'message',
        shortId: 'shortId',
        title: 'title',
      },
    );
  });

  it('changesTransformer correctness tests', () => {
    expect(changesTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(changesTransformer({})).toStrictEqual(null);

    expect(changesTransformer({
      old_path: 'test.jpg',
      new_path: 'test.mdx',
      renamed_file: true,
    })).toStrictEqual({ newFile: 'test.mdx', oldFile: 'test.jpg', renamed: true });

    // This seems wrong, but we should trust the provider
    expect(changesTransformer({
      old_path: 'test.mdx',
      new_path: 'test.mdx',
      renamed_file: true,
    })).toStrictEqual({ newFile: 'test.mdx', oldFile: 'test.mdx', renamed: true });

    expect(changesTransformer({
      old_path: 'test.mdx',
      new_path: 'test.mdx',
      renamed_file: false,
    })).toStrictEqual({ newFile: 'test.mdx', oldFile: 'test.mdx', renamed: false });

    expect(changesTransformer({
      old_path: 'test.mdx',
      new_path: 'test.jpg',
      renamed_file: true,
    })).toStrictEqual(null);
  });

  it('repositoryTransformer correctness tests', () => {
    expect(repositoryTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(repositoryTransformer({})).toStrictEqual({
      description: null,
      name: null,
      providerId: null,
      slug: null,
    });

    expect(repositoryTransformer(bigMixedObject)).toStrictEqual(
      {
        description: 'description',
        name: 'name',
        providerId: 'id',
        slug: 'path',
      },
    );
  });

  it('repositoryTreeTransformer correctness tests', () => {
    expect(repositoryTreeTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(repositoryTreeTransformer({})).toStrictEqual(null);

    expect(repositoryTreeTransformer({
      path: 'test.mdx',
      type: 'file',
    })).toStrictEqual({ dir: false, path: 'test.mdx' });

    expect(repositoryTreeTransformer({
      path: 'test',
      type: 'tree',
    })).toStrictEqual({ dir: true, path: 'test' });
  });

  it('mergeRequestTransformer correctness tests', () => {
    expect(mergeRequestTransformer(null)).toBe(null);

    // Empty object input, should not crash
    expect(mergeRequestTransformer({})).toStrictEqual({
      changesCount: null,
      description: null,
      hasConflicts: null,
      id: null,
      iid: null,
      projectId: null,
      sourceBranch: null,
      state: null,
      targetBranch: null,
      title: null,
    });

    expect(mergeRequestTransformer(bigMixedObject)).toStrictEqual(
      {
        changesCount: 'changesCount',
        description: 'description',
        hasConflicts: 'hasConflicts',
        id: 'id',
        iid: 'iid',
        projectId: 'projectId',
        sourceBranch: 'sourceBranch',
        state: 'state',
        targetBranch: 'targetBranch',
        title: 'title',
      },
    );
  });
});
