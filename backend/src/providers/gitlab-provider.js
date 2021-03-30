import { Gitlab } from '@gitbeaker/node';
import { versionTransformer, revisionTransformer, changesTransformer, repositoryTransformer } from '../transformers/gitlab'
import accessLevels from '../entities/access-levels';

export default class GitlabProvider {
  constructor(token) {
    this.gitlab = new Gitlab({
      oauthToken: token,
      requestTimeout: 3000
    });
  }

  async getUserDocumentations() {
    return (await this.gitlab.Projects.all({ owned: true })).map(rp => repositoryTransformer(rp))
  }

  async deleteProject(projectId) {
    return this.gitlab.Projects.remove(projectId)
  }

  async getUserList(search) {
    return this.gitlab.Users.search(search, {perPage: 20, maxPages: 1})
  }

  async addUser(projectId, userId, accessLevel) {
    const gitlabAccessLevel = accessLevel == accessLevels.admin ? 40 : 30;
    return this.gitlab.ProjectMembers.add(projectId, userId, gitlabAccessLevel);
  }

  async createDocumentation(docuObj) {
    const { name, slug, description } = docuObj;
    return this.gitlab.Projects.create({ name, path: slug, description })
  }

  async getDocumentation(id) {
    return this.gitlab.Projects.show(id)
  }

  async getVersions(projectId) {
    let vers = await this.gitlab.Branches.all(projectId)
    vers = vers.map((ver) => versionTransformer(ver));
    return vers
  }

  async getRevisions(projectId, ref_name) {
    let revs = await this.gitlab.Commits.all(projectId, { ref_name })
    revs = revs.map((rev) => revisionTransformer(rev));
    return revs;
  }

  async getChanges(projectId, from, to) {
    let changes = await this.gitlab.Repositories.compare(projectId, from, to)
    if (changes.diffs.length) {
      return changes.diffs.map((diff) => changesTransformer(diff)).filter((diff) => diff != null)
    }
    return []
  }

  async getBlob(projectId, revision, blob) {
    try {
      const b = await this.gitlab.RepositoryFiles.showRaw(projectId, blob, revision);
      return b
    } catch (e) {
      return "";
    }
  }


  async savePage(projectId, page) {
    throw "Not implemented yet"
  }
}