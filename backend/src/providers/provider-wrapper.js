import GitlabProvider from './gitlab-provider';

/**
 * This class is the GIT hosting provider client adapter
 */
export default class ProviderWrapper {
  /**
   * Returns the ProviderWrapper instance ready to be used
   * @param {string} slug The slug identifier of the provider
   * @param {object} tokens The provider tokens
   */
  constructor(slug, tokens) {
    switch (slug) {
      case 'gitlab':
        this.provider = new GitlabProvider(tokens[slug].access);
        break;

      default:
        throw Error(`Unknown provider ${slug} specified!`);
    }
  }

  /**
   * Searches all users in the providers database
   * @param {string} search The string to search for
   */
  async searchUsers(search) {
    return this.provider.searchUsers(search);
  }

  /**
   * Returns data of a specific user
   * @param {number} userId The ID of the user
   */
  async getUser(userId) {
    return this.provider.getUser(userId);
  }

  /**
   * Removes user from the repository
   * @param {string} projectId The providers project identifier
   * @param {number} userId The ID of the user
   */
  async removeUser(projectId, userId) {
    return this.provider.removeUser(projectId, userId);
  }

  /**
   * Adds user to the repository
   * @param {string} projectId The providers project identifier
   * @param {number} userId The ID of the user
   * @param {accessLevel} accessLevel The numeric value of the access level
   */
  async addUser(projectId, userId, accessLevel) {
    return this.provider.addUser(projectId, userId, accessLevel);
  }

  /**
   * Creates a new repository
   * @param {Object} docuObj The object describing the documentation to create
   */
  async createDocumentation(docuObj) {
    return this.provider.createDocumentation(docuObj);
  }

  /**
   * Removes a repository
   * @param {string} projectId The providers project identifier
   */
  async removeDocu(projectId) {
    return this.provider.removeDocu(projectId);
  }

  /**
   * Returns repository information
   * @param {string} projectId The providers project identifier
   */
  async getDocumentation(projectId) {
    return this.provider.getDocumentation(projectId);
  }

  /**
   * Returns information about branches
   * @param {string} projectId The providers project identifier
   */
  async getVersions(projectId) {
    return this.provider.getVersions(projectId);
  }

  /**
   * Returns information about the last 1000 of commits
   * @param {string} projectId The providers project identifier
   * @param {string} refName The branch identifier
   */
  async getRevisions(projectId, refName) {
    return this.provider.getRevisions(projectId, refName);
  }

  /**
   * Returns the list of changes made between two commits
   * @param {string} projectId The providers project identifier
   * @param {string} from The from commit identifier
   * @param {string} to The to commit identifier
   */
  async getChanges(projectId, from, to) {
    return this.provider.getChanges(projectId, from, to);
  }

  /**
   * Returns a list of files in a folder
   * @param {string} projectId The providers project identifier
   * @param {string} revision The commit identifier
   * @param {string} path the resource path
   */
  async getFiles(projectId, revision, path) {
    return this.provider.getFiles(projectId, revision, path);
  }

  /**
   * Returns a blob file
   * @param {string} projectId The providers project identifier
   * @param {string} revision The commit identifier
   * @param {string} blob the resource path
   */
  async getBlob(projectId, revision, blob) {
    return this.provider.getBlob(projectId, revision, blob);
  }

  /**
   * Saves a file. If the file does not exist, it creates it.
   * @param {string} projectId The providers project identifier
   * @param {string} page The page path
   * @param {string} branch The branch identifier
   * @param {string} content Content of the page
   * @param {string} commitMessage The commit message
   */
  async savePage(projectId, page, branch, content, commitMessage) {
    return this.provider.savePage(projectId, page, branch, content, commitMessage);
  }

  /**
   * Deletes a file
   * @param {string} projectId The providers project identifier
   * @param {string} file The file path
   * @param {string} branch The branch identifier
   * @param {string} commitMessage The commit message
   */
  async deleteFile(projectId, file, branch, commitMessage) {
    return this.provider.deleteFile(projectId, file, branch, commitMessage);
  }

  /**
   * Creates a merge request
   * @param {string} projectId The providers project identifier
   * @param {string} source The source branch identifier
   * @param {string} target The target branch identifier
   * @param {string} title The merge request title
   */
  async finishProofreading(projectId, source, target, title) {
    return this.provider.createPR(projectId, source, target, title);
  }

  /**
   * Merges the specified merge request
   * @param {string} projectId The providers project identifier
   * @param {string} prId Internal ID of the merge request
   */
  async merge(projectId, prId) {
    return this.provider.merge(projectId, prId);
  }

  /**
   * Returns merge request info
   * @param {string} projectId The providers project identifier
   * @param {string} prId Internal ID of the merge request
   */
  async getMergeRequest(projectId, prId) {
    return this.provider.getMergeRequest(projectId, prId);
  }

  /**
   * Closes a specified merge request
   * @param {string} projectId The providers project identifier
   * @param {string} prId Internal ID of the merge request
   */
  async closeMergeRequest(projectId, prId) {
    return this.provider.closeMergeRequest(projectId, prId);
  }

  /**
   * Creates a new branch
   * @param {string} projectId The providers project identifier
   * @param {string} branch The branch identifier
   * @param {string} ref name of the new branch
   */
  async createBranch(projectId, branch, ref) {
    return this.provider.createBranch(projectId, branch, ref);
  }
}
