import lodash from 'lodash';
import config from '../config';
import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import Role from '../entities/role';
import User from '../entities/user';
import ProviderWrapper from '../providers/provider-wrapper';
import sendEmail from './mailer';

/**
 * This is the documentation service class.
 */
export default class DocumentationService {
  /**
   * Creates DocumentationService instance
   * @param {User} user instance of currently logged in user
   */
  constructor(user) {
    this.user = user;
  }

  /**
   * Creates or updates a new documentation
   * @param {Object} params Documentation parameters, @see Documentation
   * @returns {Documentation} The created documentation
   */
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

  /**
   * Gets a list of users documentation
   * @returns {Documentation[]} List of found documentations
   */
  async getList() {
    const docus = await Documentation.getUserDocumentations(this.user.id);
    return docus;
  }

  /**
   * Searches for users matching the search string
   * @param {string} providerSlug Provider identifier
   * @param {string} search Search string
   * @returns List of users
   */
  async getRemoteUserList(providerSlug, search) {
    const provider = new ProviderWrapper(providerSlug, this.user.tokens);
    return provider.searchUsers(search);
  }

  async getRemoteList(providerId) {
    const provider = new ProviderWrapper(providerId, this.user.tokens);
    const ids = await Documentation.getProviderIds(this.user.id, providerId);
    return (await provider.getUserDocumentations()).filter((d) => !ids.includes(d.providerId));
  }

  /**
   * Gets a documentation by its ID
   * @param {number} docuId ID of the documentation
   * @returns {Documentation} Found documentation
   */
  async get(docuId) {
    const docu = await Documentation.get(docuId);
    docu.accessLevel = await docu.getAccessLevel(this.user.id);
    return docu;
  }

  /**
   * Gets a list of users that have access to the documentation
   * @param {number} docuId ID of the documentation
   * @returns {User[]} List of users with documentation access
   */
  static async getUsers(docuId) {
    return Documentation.getUsers(docuId);
  }

  /**
   * Removes a user from the documentation
   * @param {number} docuId ID of the documentation
   * @param {number} userId ID of the user
   */
  async removeUser(docuId, userId) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const user = await User.getById(userId);
    await provider.removeUser(docu.providerId, user.linked[docu.provider]);
    await Role.remove(userId, docuId);
    sendEmail(
      (user),
      'Your access to a documentation was revoked',
      `Your access to documentation ${docu.name} was just revoked.<br/><br/>
      Please check the Git-md-diff app at 
      <a href="${config.gitlab.authRedirect}">${config.gitlab.authRedirect}</a> for more information.`,
    );
  }

  /**
   * Adds a user to the documentation
   * @param {number} docuId ID of the documentation
   * @param {Object} userInfo Object containing the necessary info about the user
   */
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

    sendEmail(
      (await User.getById(found.id)),
      'You were given access a new documentation',
      `You were just given access a documentation ${docu.name}.<br/><br/>
      Please check the Git-md-diff app at 
      <a href="${config.gitlab.authRedirect}">${config.gitlab.authRedirect}</a> for more information.`,
    );
  }

  async editUser(docuId, userInfo, userId) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const info = userInfo;
    const found = await User.getById(userId);

    await provider.editUser(docu.providerId, found.linked[docu.provider], parseInt(info.level, 10));

    const role = new Role({ level: info.level, docuId, userId });
    await role.save();

    sendEmail(
      (await User.getById(userId)),
      'Your role was just updated',
      `Your user role in documentation ${docu.name} was just updated.<br/><br/>
      Please check the Git-md-diff app at 
      <a href="${config.gitlab.authRedirect}">${config.gitlab.authRedirect}</a> for more information.`,
    );
  }

  /**
   * Removes the documentation, optionally along with the underlying repository
   * @param {number} docuId ID of the documentation
   * @param {boolean} deleteRepo Indicates whether to delete the underlying repository
   */
  async remove(docuId, deleteRepo) {
    const docu = await Documentation.get(docuId);
    if (deleteRepo) {
      const provider = new ProviderWrapper(docu.provider, this.user.tokens);
      await provider.removeDocu(docu.providerId);
    }
    await Documentation.remove(docuId);
  }

  /**
   * Gets a list of repository branches
   * @param {number} docuId ID of the documentation
   * @returns
   */
  async getVersions(docuId) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getVersions(docu.providerId);
  }

  /**
   * Gets a list of repository commits
   * @param {number} docuId ID of the documentation
   * @param {string} version Branch identifier
   * @returns
   */
  async getRevisions(docuId, version) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getRevisions(docu.providerId, version);
  }

  /**
   * Gets a list of changes between commits
   * @param {number} docuId ID of the documentation
   * @param {string} from Identifier of the from commit
   * @param {string} to Identifier of the to commit
   * @returns
   */
  async getChanges(docuId, from, to) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.getChanges(docu.providerId, from, to);
  }

  /**
   * Gets a blob file from the repository
   * @param {number} docuId ID of the documentation
   * @param {string} revision Commit identifier
   * @param {string} blob File path
   * @returns
   */
  async getBlob(docuId, revision, blob) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const p = await provider.getBlob(docu.providerId, revision, blob);
    return p;
  }

  /**
   * Gets a list of files in a folder
   * @param {number} docuId ID of the documentation
   * @param {string} revision Commit identifier
   * @param {string} path Folder path
   * @returns
   */
  async getFiles(docuId, revision, path) {
    const docu = await Documentation.get(docuId);
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const p = await provider.getFiles(docu.providerId, revision, path);
    return p;
  }

  /**
   * Saves a file to repository
   * @param {number} docuId ID of the documentation
   * @param {string} version Branch identifier
   * @param {string} page Path of the file
   * @param {string} content Content of the file
   * @param {string} commitMessage Commit message
   */
  async savePage(docuId, version, page, content, commitMessage) {
    const docu = await Documentation.get(docuId);
    const projectId = docu.providerId;
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    await provider.savePage(projectId, page, version, content, commitMessage);
  }

  /**
   * Deletes a file from repository
   * @param {number} docuId ID of the documentation
   * @param {string} version  Branch identifier
   * @param {string} file Path of the file
   * @param {string} commitMessage Commit message
   * @returns
   */
  async deleteFile(docuId, version, file, commitMessage) {
    const docu = await Documentation.get(docuId);
    const projectId = docu.providerId;
    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    return provider.deleteFile(projectId, file, version, commitMessage);
  }
}
