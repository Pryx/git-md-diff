import { Gitlab } from '@gitbeaker/node';

export default class GitlabProvider{
  constructor(token) {
    this.gitlab = new Gitlab({
      oauthToken: token,
      requestTimeout: 3000
    });    
  }

  async createDocumentation(docuObj){
    const {name, slug, description} = docuObj;
    return this.gitlab.Projects.create({name, path: slug, description})
  }

  async getDocumentation(id){
    return this.gitlab.Projects.show(id)
  }

  async getVersions(projectId) {
    return this.gitlab.Branches.all(projectId)
  }

  async getRevisions(projectId, ref_name) {
    return this.gitlab.Commits.all(projectId, {ref_name})
  }

  async getChanges(projectId, from, to) {
    return this.gitlab.Repositories.compare(projectId, from, to)
  }

  async getPage(projectId, revision, page) {
    throw "Not implemented yet"
  }

  async getBlob(projectId, revision, blob) {
    throw "Not implemented yet"
  }

  async savePage(projectId, page) {
    throw "Not implemented yet"
  }
}