import { Gitlab } from '@gitbeaker/node';
import {
  versionTransformer, revisionTransformer, changesTransformer,
  repositoryTransformer, repositoryTreeTransformer,
} from '../transformers/gitlab';
import accessLevels from '../entities/access-levels';

export default class GitlabProvider {
  constructor(token) {
    this.gitlab = new Gitlab({
      oauthToken: token,
      requestTimeout: 3000,
    });
  }

  async getUserDocumentations() {
    return (await this.gitlab.Projects.all({ owned: true })).map((rp) => repositoryTransformer(rp));
  }

  async deleteProject(projectId) {
    return this.gitlab.Projects.remove(projectId);
  }

  async getUserList(search) {
    return this.gitlab.Users.search(search, { perPage: 20, maxPages: 1 });
  }

  async getUser(userId) {
    return this.gitlab.Users.show(userId);
  }

  async removeUser(docuId, userId) {
    return this.gitlab.ProjectMembers.remove(docuId, userId);
  }

  async addUser(projectId, userId, accessLevel) {
    const gitlabAccessLevel = accessLevel === accessLevels.admin ? 40 : 30;
    return this.gitlab.ProjectMembers.add(projectId, userId, gitlabAccessLevel);
  }

  async createDocumentation(docuObj) {
    const {
      name, slug, description, providerId,
    } = docuObj;
    if (providerId !== -1) {
      return this.gitlab.Projects.edit(providerId, { name, path: slug, description });
    }

    return this.gitlab.Projects.create({ name, path: slug, description });
  }

  async removeDocu(id) {
    return this.gitlab.Projects.remove(id);
  }

  async getDocumentation(id) {
    return this.gitlab.Projects.show(id);
  }

  async getVersions(projectId) {
    let vers = await this.gitlab.Branches.all(projectId);
    vers = vers.map((ver) => versionTransformer(ver));
    return vers;
  }

  async getRevisions(projectId, refName) {
    let revs = await this.gitlab.Commits.all(projectId, { refName });
    revs = revs.map((rev) => revisionTransformer(rev));
    return revs;
  }

  async getChanges(projectId, from, to) {
    const changes = await this.gitlab.Repositories.compare(projectId, from, to);
    if (changes.diffs.length) {
      return changes.diffs.map((diff) => changesTransformer(diff)).filter((diff) => diff != null);
    }
    return [];
  }

  async getFiles(projectId, revision) {
    const tree = await this.gitlab.Repositories.tree(projectId, { ref: revision, recursive: true });
    if (tree.length) {
      return tree.map((t) => repositoryTreeTransformer(t)).filter((diff) => diff != null);
    }
    console.log(tree);

    return tree;
  }

  async getBlob(projectId, revision, blob) {
    try {
      const b = await this.gitlab.RepositoryFiles.showRaw(projectId, blob, revision);
      return b;
    } catch (e) {
      return '';
    }
  }

  async savePage(projectId, page, branch, content) {
    return this.gitlab.RepositoryFiles.edit(projectId, page, branch, content, `Edited ${page} via Git-md-diff`);
  }

  async createPR(projectId, source, target, title) {
    return this.gitlab.MergeRequests.create(projectId, source, target, title);
  }

  async merge(projectId, iid) {
    return this.gitlab.MergeRequests.accept(
      projectId,
      iid,
      { squash: true, should_remove_source_branch: true },
    );
  }
}
