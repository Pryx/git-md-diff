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

  async getFiles(projectId, revision) {
    return this.provider.getFiles(projectId, revision);
  }

  async getBlob(projectId, revision, blob) {
    return this.provider.getBlob(projectId, revision, blob);
  }

  async savePage(projectId, page, branch, content) {
    return this.provider.savePage(projectId, page, branch, content);
  }

  async finishProofreading(projectId, source, target, title) {
    return this.provider.createPR(projectId, source, target, title);
  }

  async merge(projectId, prId) {
    return this.provider.merge(projectId, prId);
  }
}
