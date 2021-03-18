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
    return docu;
  }


  async getVersions(docuId) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    return provider.getVersions(docu.providerId);
  }

  async getRevisions(docuId, version) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    return provider.getRevisions(docu.providerId, version);
  }

  async getChanges(docuId, from, to) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    return provider.getChanges(docu.providerId, from, to);
  }

  async getPage(docuId, revision, page) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const p = await provider.getPage(docu.providerId, revision, page);
    return p
  }

  async getBlob(docuId, revision, blob) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const blobObj = provider.getBlob(docuId, revision, blob);

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