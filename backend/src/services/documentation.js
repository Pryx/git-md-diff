import lodash from 'lodash';
import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import Role from '../entities/role';
import User from '../entities/user';
import ProviderWrapper from '../providers/provider-wrapper';

export default class DocumentationService {
  constructor(user) {
    this.user = user;
  }

  async create(params) {
    if (params.id) {
      let docu = await Documentation.get(params.id);

      docu = lodash.merge(docu, params);

      const provider = new ProviderWrapper(docu.provider, this.user.tokens);

      // ? This will throw if there is any duplicity etc.
      await provider.createDocumentation(docu);

      await docu.save();

      return docu;
    }
    const docu = new Documentation(params);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);

    // ? This will throw if there is any duplicity etc.
    const docuObj = await provider.createDocumentation(docu);
    docu.providerId = docuObj.id;

    await docu.save();

    const resDocu = await Documentation.getByProviderId(docu.provider, docu.providerId);
    const role = new Role({ docuId: resDocu.id, userId: this.user.id, level: accessLevels.admin });
    await role.save();
    return docu;
  }

  async getList() {
    const docus = await Documentation.getUserDocumentations(this.user.id);
    return docus;
  }

  async getRemoteList(providerId) {
    const provider = new ProviderWrapper(providerId, this.user.tokens);
    const ids = await Documentation.getProviderIds(this.user.id, providerId);
    return (await provider.getUserDocumentations()).filter((d) => !ids.includes(d.id));
  }

  async getRemoteUserList(providerId, search) {
    const provider = new ProviderWrapper(providerId, this.user.tokens);
    return provider.getUserList(search);
  }

  async get(docuId) {
    const docu = await Documentation.get(docuId);
    docu.accessLevel = await docu.getAccessLevel(this.user.id);
    return docu;
  }

  static async getUsers(docuId) {
    return Documentation.getUsers(docuId);
  }

  async removeUser(docuId, userId) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const user = await User.getById(userId);
    await provider.removeUser(docu.providerId, user.linked[docu.provider]);
    await Role.remove(userId, docuId);
  }

  async addUser(docuId, userInfo) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const info = userInfo;
    info.providerId = userInfo.providerId.toString();
    let found = await User.getByProviderId(info.providerId, docu.provider);

    if (found === null) {
      const providerUser = await provider.getUser(info.providerId);
      const { name, public_email } = providerUser; // eslint-disable-line
      const linked = {};
      linked[docu.provider] = info.providerId;
      const user = new User({ name, email: public_email, linked }); // eslint-disable-line
      await user.save();
      found = await User.getByProviderId(info.providerId.toString(), docu.provider);
    }

    await provider.addUser(docu.providerId, info.providerId, info.level);

    const role = new Role({ level: info.level, docuId, userId: found.id });
    await role.save();
  }

  async remove(docuId, deleteRepo) {
    const docu = await Documentation.get(docuId);
    if (deleteRepo) {
      const provider = new ProviderWrapper(docu.provider, this.user.tokens);
      await provider.removeDocu(docu.providerId);
    }
    await Documentation.remove(docuId);
  }

  async getVersions(docuId) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getVersions(docu.providerId);
  }

  async getRevisions(docuId, version) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getRevisions(docu.providerId, version);
  }

  async getChanges(docuId, from, to) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getChanges(docu.providerId, from, to);
  }

  async getBlob(docuId, revision, blob) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const p = await provider.getBlob(docu.providerId, revision, blob);
    return p;
  }

  async getFiles(docuId, revision, path) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const p = await provider.getFiles(docu.providerId, revision, path);
    return p;
  }

  async savePage(docuId, version, page, content, commitMessage) {
    const docu = await Documentation.get(docuId);
    const projectId = docu.providerId;
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    await provider.savePage(projectId, page, version, content, commitMessage);
  }

  async deleteFile(docuId, version, file, commitMessage) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.deleteFile(projectId, file, version, commitMessage);
  }
}
