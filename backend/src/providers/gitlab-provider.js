import { Gitlab } from '@gitbeaker/node';
import {versionTransformer, revisionTransformer, changesTransformer} from '../transformers/gitlab' 

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
    let vers = await this.gitlab.Branches.all(projectId)
    vers = vers.map((ver) => versionTransformer(ver));
    return vers
  }

  async getRevisions(projectId, ref_name) {
    let revs = await this.gitlab.Commits.all(projectId, {ref_name})
    revs = revs.map((rev) => revisionTransformer(rev));
    return revs;
  }

  async getChanges(projectId, from, to) {
    let changes = await this.gitlab.Repositories.compare(projectId, from, to)
    if (changes.diffs.length){
      return changes.diffs.map((diff) => changesTransformer(diff)).filter((diff) => diff != null)
    }
    return []
  }

  async getPage(projectId, revision, file) {
    try{
      const page = await this.gitlab.RepositoryFiles.showRaw(projectId, file, revision);
      return page
    }catch(e){
      return "";
    }
  }

  async getBlob(projectId, revision, blob) {
    throw "Not implemented yet"
  }

  async savePage(projectId, page) {
    throw "Not implemented yet"
  }
}