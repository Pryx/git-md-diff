import GitlabProvider from './gitlab-provider';

export default class ProviderWrapper {
  constructor(slug, tokens) {
    switch (slug) {
      case 'gitlab':
        this.provider = new GitlabProvider(tokens[slug].access);
        break;

      default:
        throw Error(`Unknown provider ${slug} specified!`);
    }
  }

  async getUserDocumentations() {
    return this.provider.getUserDocumentations();
  }

  async deleteProject(projectId) {
    return this.provider.deleteProject(projectId);
  }

  async getUserList(search) {
    return this.provider.getUserList(search);
  }

  async getUser(userId) {
    return this.provider.getUser(userId);
  }

  async removeUser(docuId, userId) {
    return this.provider.removeUser(docuId, userId);
  }

  async addUser(projectId, userId, accessLevel) {
    return this.provider.addUser(projectId, userId, accessLevel);
  }

  async createDocumentation(docuObj) {
    return this.provider.createDocumentation(docuObj);
  }

  async removeDocu(id) {
    return this.provider.removeDocu(id);
  }

  async getDocumentation(id) {
    return this.provider.getDocumentation(id);
  }

  async getVersions(projectId) {
    return this.provider.getVersions(projectId);
  }

  async getRevisions(projectId, refName) {
    return this.provider.getRevisions(projectId, refName);
  }

  async getChanges(projectId, from, to) {
    return this.provider.getChanges(projectId, from, to);
  }

  async getFiles(projectId, revision, path) {
    return this.provider.getFiles(projectId, revision, path);
  }

  async getBlob(projectId, revision, blob) {
    return this.provider.getBlob(projectId, revision, blob);
  }

  async savePage(projectId, page, branch, content, commitMessage) {
    return this.provider.savePage(projectId, page, branch, content, commitMessage);
  }

  async finishProofreading(projectId, source, target, title) {
    return this.provider.createPR(projectId, source, target, title);
  }

  async merge(projectId, prId) {
    return this.provider.merge(projectId, prId);
  }

  async getMergeRequest(projectId, prId) {
    return this.provider.getMergeRequest(projectId, prId);
  }

  async closeMergeRequest(projectId, prId) {
    return this.provider.closeMergeRequest(projectId, prId);
  }

  async createBranch(projectId, branch, ref) {
    return this.provider.createBranch(projectId, branch, ref);
  }
}
