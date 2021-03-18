import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import Role from '../entities/role';
import GitlabProvider from '../providers/gitlab-provider';

export default class DocumentationService {
  constructor(user) {
    this.user = user;
  }

  async create(params) {
    const docu = new Documentation(params);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    //* This will throw if there is any duplicity etc.
    const docuObj = await provider.createDocumentation(docu);
    docu.providerId = docuObj.id;
    await docu.save();

    const resDocu = await Documentation.getByProviderId(docu.provider, docu.providerId);
    const role = new Role({docuId: resDocu.id, userId: this.user.id, level: accessLevels.admin });
    role.save();
    return docu;
  }

  async getList() {
    const docus = await Documentation.getUserDocumentations(this.user.id);
    return docus;
  }

  async get(docuId) {
    const docu = await Documentation.get(docuId);
    docu.accessLevel = docu.getAccessLevel(this.user.id);
    return d;
  }


  async getVersions(docuId) {
    const docu = await Documentation.get(docuId);
    console.error(docu)
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const versions = await provider.getVersions(docu.providerId);
    //TODO: Transform
    console.error(versions)
    return versions;
  }

  async getRevisions(docuId, version) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const revisions = await provider.getRevisions(docu.providerId, version);
    //TODO: Transform
    console.error(revisions)
    return revisions
  }

  async getChanges(docuId, from, to) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const changes = provider.getChanges(docu.providerId, from, to);
    //TODO: Transform

    // Todo: More robust file filtering
    const fileChanges = changes.files.filter((change) => change.file.includes('.md'));


    console.error(changes)
    throw "Not implemented yet"
  }

  async getPage(docuId, revision, page) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const pageObj = provider.getPage(docu.providerId, revision, page);
    //TODO: Transform
    console.error(pageObj)

    throw "Not implemented yet"
  }

  async getBlob(docuId, revision, blob) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const blobObj = provider.getBlob(docuId, revision, blob);
    //TODO: Transform

    console.error(blobObj)

    throw "Not implemented yet"
  }

  async savePage(docuId, page) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    //! TODO: We should implement proper branching and more...
    throw "Not implemented yet"
  }

  static getProvider(slug, user) {
    switch (slug) {
      case 'gitlab':
        if (DocumentationService.gitlab) {
          return DocumentationService.gitlab;
        }

        DocumentationService.gitlab = new GitlabProvider(user.tokens.gitlab.access);
        return DocumentationService.gitlab;

      default:
        throw  {message: `Unknown provider ${slug} specified!`};
    }
  }
}