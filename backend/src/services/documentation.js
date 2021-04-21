import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import Role from '../entities/role';
import GitlabProvider from '../providers/gitlab-provider';
import lodash from 'lodash';
import User from '../entities/user';

export default class DocumentationService {
  constructor(user) {
    this.user = user;
  }

  async create(params) {
    if (params.id){
      let docu = await Documentation.get(params.id);

      docu = lodash.merge(docu, params);

      const provider = DocumentationService.getProvider(docu.provider, this.user);

      //? This will throw if there is any duplicity etc.
      await provider.createDocumentation(docu);

      await docu.save();
      
      return docu;
    }else{
      const docu = new Documentation(params);
      const provider = DocumentationService.getProvider(docu.provider, this.user);

      //? This will throw if there is any duplicity etc.
      const docuObj = await provider.createDocumentation(docu);
      docu.providerId = docuObj.id;

      await docu.save();

      const resDocu = await Documentation.getByProviderId(docu.provider, docu.providerId);
      const role = new Role({ docuId: resDocu.id, userId: this.user.id, level: accessLevels.admin });
      role.save();
      return docu;
    }
  }

  async getList() {
    const docus = await Documentation.getUserDocumentations(this.user.id);
    return docus;
  }

  async getRemoteList(providerId) {
    const provider = DocumentationService.getProvider(providerId, this.user);
    const ids = await Documentation.getProviderIds(this.user.id, providerId);
    return (await provider.getUserDocumentations()).filter((d) => !ids.includes(d.id));
  }

  async getRemoteUserList(providerId, search) {
    const provider = DocumentationService.getProvider(providerId, this.user);
    return provider.getUserList(search);
  }

  async get(docuId) {
    const docu = await Documentation.get(docuId);
    docu.accessLevel = docu.getAccessLevel(this.user.id);
    return docu;
  }

  static async getUsers(docuId) {
    return Documentation.getUsers(docuId);
  }

  async removeUser(docuId, userId) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const user = await User.getById(userId);
    provider.removeUser(docu.providerId, user.linked[docu.provider]);
    await Role.remove(userId, docuId);
  }

  async addUser(docuId, userInfo) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    userInfo.providerId = userInfo.providerId.toString();
    let found = await User.getByProviderId(userInfo.providerId, docu.provider);

    if (found === null){
      const providerUser = await provider.getUser(userInfo.providerId);
      const {name, public_email} = providerUser;
      const linked = {};
      linked[docu.provider] = userInfo.providerId;
      const user = new User({name, email: public_email, linked});
      await user.save();
      found = await User.getByProviderId(userInfo.providerId.toString(), docu.provider);
    }

    provider.addUser(docu.providerId, userInfo.providerId, userInfo.level);

    const role = new Role({level: userInfo.level, docuId, userId: found.id})
    role.save();
  }

  async remove(docuId, deleteRepo) {
    const docu = await Documentation.get(docuId);
    if (deleteRepo){
      const provider = DocumentationService.getProvider(docu.provider, this.user);
      provider.removeDocu(docu.providerId);
    }
    Documentation.remove(docuId);
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

  async getBlob(docuId, revision, blob) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    const p = await provider.getBlob(docu.providerId, revision, blob);
    return p;
  }

  async savePage(docuId, page) {
    const docu = await Documentation.get(docuId);
    const provider = DocumentationService.getProvider(docu.provider, this.user);
    provider.savePage(page);
    //! TODO: We should implement proper branching and more...
    throw Error('Not implemented yet');
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
        throw Error(`Unknown provider ${slug} specified!`);
    }
  }
}
