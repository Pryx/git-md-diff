import { Gitlab } from '@gitbeaker/node';
import config from '../config';
import accessLevels from '../entities/access-levels';
import {
  changesTransformer,
  mergeRequestTransformer, repositoryTransformer, repositoryTreeTransformer, revisionTransformer, versionTransformer,
} from '../transformers/gitlab';

/**
 * The Gitlab provider client implementation
 */
export default class GitlabProvider {
  constructor(token) {
    this.gitlab = new Gitlab({
      oauthToken: token,
      requestTimeout: 3000,
      host: config.gitlab.baseUrl,
    });
  }

  /**
   * Searches all users in the providers database
   * @param {string} search The string to search for
   */
  async searchUsers(search) {
    return this.gitlab.Users.search(search, { perPage: 20, maxPages: 1 });
  }

  /**
   * Returns data of a specific user
   * @param {number} userId The ID of the user
   */
  async getUser(userId) {
    return this.gitlab.Users.show(userId);
  }

  /**
   * Removes user from the repository
   * @param {string} projectId The providers project identifier
   * @param {number} userId The ID of the user
   */
  async removeUser(projectId, userId) {
    return this.gitlab.ProjectMembers.remove(projectId, userId);
  }

  /**
   * Adds user to the repository
   * @param {string} projectId The providers project identifier
   * @param {number} userId The ID of the user
   * @param {accessLevel} accessLevel The numeric value of the access level
   */
  async addUser(projectId, userId, accessLevel) {
    const gitlabAccessLevel = accessLevel === accessLevels.admin ? 40 : 30;
    return this.gitlab.ProjectMembers.add(projectId, userId, gitlabAccessLevel);
  }

  /**
   * Edits user in the repository
   * @param {string} projectId The providers project identifier
   * @param {number} userId The ID of the user
   * @param {accessLevel} accessLevel The numeric value of the access level
   */
  async editUser(projectId, userId, accessLevel) {
    const gitlabAccessLevel = accessLevel === accessLevels.admin ? 40 : 30;
    console.log(accessLevel === accessLevels.admin);
    return this.gitlab.ProjectMembers.edit(projectId, userId, gitlabAccessLevel);
  }

  /**
   * Creates a new repository
   * @param {Object} docuObj The object describing the documentation to create
   */
  async createDocumentation(docuObj) {
    const {
      name, slug, description, providerId,
    } = docuObj;
    if (providerId !== '') {
      return this.gitlab.Projects.edit(providerId, { name, path: slug, description });
    }

    return this.gitlab.Projects.create({ name, path: slug, description });
  }

  /**
   * Removes a repository
   * @param {string} projectId The providers project identifier
   */
  async removeDocu(projectId) {
    return this.gitlab.Projects.remove(projectId);
  }

  /**
   * Returns repository information
   * @param {string} projectId The providers project identifier
   */
  async getDocumentation(projectId) {
    return this.gitlab.Projects.show(projectId);
  }

  /**
   * Returns information about branches. It is limited to 1000 branches.
   * @param {string} projectId The providers project identifier
   */
  async getVersions(projectId) {
    // These limits are here because if no limit is used then GitLab is extremely slow...
    let vers = await this.gitlab.Branches.all(projectId, { page: 1, per_page: 1000 });
    vers = vers.map((ver) => versionTransformer(ver));

    return vers;
  }

  /**
   * Returns information about the last 1000 of commits
   * @param {string} projectId The providers project identifier
   * @param {string} refName The branch identifier
   */
  async getRevisions(projectId, refName) {
    // These limits are here because if no limit is used then GitLab is extremely slow...
    let revs = await this.gitlab.Commits.all(projectId, { refName, page: 1, per_page: 1000 });
    revs = revs.map((rev) => revisionTransformer(rev));

    return revs;
  }

  /**
   * Returns the list of changes made between two commits
   * @param {string} projectId The providers project identifier
   * @param {string} from The from commit identifier
   * @param {string} to The to commit identifier
   */
  async getChanges(projectId, from, to) {
    const changes = await this.gitlab.Repositories.compare(projectId, from, to);
    if (changes.diffs.length) {
      return changes.diffs.map((diff) => changesTransformer(diff)).filter((diff) => diff != null);
    }
    return [];
  }

  /**
   * Returns a list of files in a folder
   * @param {string} projectId The providers project identifier
   * @param {string} revision The commit identifier
   * @param {string} path the resource path
   */
  async getFiles(projectId, revision, path) {
    const tree = await this.gitlab.Repositories.tree(projectId, {
      ref: revision, recursive: false, path, per_page: 100,
    });
    if (tree.length) {
      return tree.map((t) => repositoryTreeTransformer(t)).filter((diff) => diff != null);
    }

    return tree;
  }

  /**
   * Returns a blob file
   * @param {string} projectId The providers project identifier
   * @param {string} revision The commit identifier
   * @param {string} blob the resource path
   */
  async getBlob(projectId, revision, blob) {
    try {
      const b = await this.gitlab.RepositoryFiles.showRaw(projectId, blob, revision);
      return b;
    } catch (e) {
      return '';
    }
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
    let response;
    try {
      response = await this.gitlab.RepositoryFiles.edit(
        projectId,
        page,
        branch,
        content,
        commitMessage || `Edited ${page} via Git-md-diff`,
      );
    } catch (e) {
      // Gitbeaker doesn't really provide us with status code,
      // so let's just try to create a new file...
      response = await this.gitlab.RepositoryFiles.create(
        projectId,
        page,
        branch,
        content,
        commitMessage || `Created ${page} via Git-md-diff`,
      );
    }

    return response;
  }


  async getUserDocumentations() {
    return (await this.gitlab.Projects.all({ owned: true })).map((rp) => repositoryTransformer(rp));
  }

  /**
   * Deletes a file
   * @param {string} projectId The providers project identifier
   * @param {string} file The file path
   * @param {string} branch The branch identifier
   * @param {string} commitMessage The commit message
   */
  async deleteFile(projectId, file, branch, commitMessage) {
    return this.gitlab.RepositoryFiles.remove(
      projectId,
      file,
      branch,
      commitMessage || `Deleted file ${file} via Git-md-diff`,
    );
  }

  /**
   * Creates a merge request
   * @param {string} projectId The providers project identifier
   * @param {string} source The source branch identifier
   * @param {string} target The target branch identifier
   * @param {string} title The merge request title
   */
  async createPR(projectId, source, target, title) {
    return this.gitlab.MergeRequests.create(projectId, source, target, title);
  }

  /**
   * Merges the specified merge request
   * @param {string} projectId The providers project identifier
   * @param {string} iid Internal ID of the merge request
   */
  async merge(projectId, iid) {
    return this.gitlab.MergeRequests.accept(
      projectId,
      iid,
      { squash: true, should_remove_source_branch: true },
    );
  }

  /**
   * Returns merge request info
   * @param {string} projectId The providers project identifier
   * @param {string} iid Internal ID of the merge request
   */
  async getMergeRequest(projectId, iid) {
    return mergeRequestTransformer(await this.gitlab.MergeRequests.show(
      projectId,
      iid,
    ));
  }

  /**
   * Closes a specified merge request
   * @param {string} projectId The providers project identifier
   * @param {string} iid Internal ID of the merge request
   */
  async closeMergeRequest(projectId, iid) {
    return this.gitlab.MergeRequests.edit(
      projectId,
      iid,
      { stateEvent: 'close' },
    );
  }

  /**
   * Creates a new branch
   * @param {string} projectId The providers project identifier
   * @param {string} branch The branch identifier
   * @param {string} ref name of the new branch
   */
  async createBranch(projectId, branch, ref) {
    return this.gitlab.Branches.create(
      projectId,
      branch,
      ref,
    );
  }
}
