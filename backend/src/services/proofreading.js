import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import ProofreadingRequest from '../entities/proofreading-request';
import proofreadingStates from '../entities/proofreading-states';
import Role from '../entities/role';
import ProviderWrapper from '../providers/provider-wrapper';

/**
 * This is the proofreading service class.
 */
export default class ProofreadingService {
  /**
   * Creates ProofreadingService instance
   * @param {User} user instance of currently logged in user
   */
  constructor(user) {
    this.user = user;
  }

  /**
   * Creates a new proofreading request
   * @param {Object} params Proofreading request parameters, @see ProofreadingRequest
   * @returns
   */
  async create(params) {
    const req = new ProofreadingRequest(params);

    const docu = await Documentation.get(req.docuId);

    const provider = new ProviderWrapper(docu.provider, this.user.tokens); //eslint-disable-line
    const savedReq = new ProofreadingRequest(...await req.save());

    await provider.createBranch(docu.providerId, `git-md-proofreading-${savedReq.id}`, savedReq.revTo);
    savedReq.sourceBranch = `git-md-proofreading-${savedReq.id}`;
    await savedReq.save();
    return savedReq;
  }

  /**
   * Gets request by its ID
   * @param {number} reqId The id of the request
   * @returns {ProofreadingRequest} The found proofreading request
   */
  async get(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    const perm = Role.get(this.user.id, req.docuId);

    if (req.proofreader.id !== this.user.id && req.requester.id !== this.user.id
      && !(perm.level === accessLevels.manager || perm.level === accessLevels.admin)) {
      throw Error('Not authorized to access this proofreading request.');
    }

    return req;
  }

  /**
   * Marks the request as finished
   * @param {number} reqId The id of the request
   * @returns {ProofreadingRequest} The modified proofreading request
   */
  async finished(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    const docu = await Documentation.get(req.docuId);

    const provider = new ProviderWrapper(docu.provider, this.user.tokens);

    const response = await provider.finishProofreading(
      docu.providerId,
      req.sourceBranch,
      req.targetBranch,
      `Completed proofreading nr. ${req.id}`,
    );

    req.pullRequest = response.iid;
    req.state = proofreadingStates.submitted;
    req.save();

    return req;
  }

  /**
   * Merges the completed request
   * @param {number} reqId The id of the request
   * @returns {ProofreadingRequest} The modified proofreading request
   */
  async merge(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    const docu = await Documentation.get(req.docuId);

    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const mergeReq = await provider.getMergeRequest(
      docu.providerId,
      req.pullRequest,
    );

    // If no changes, just close the request
    if (mergeReq.changesCount === null) {
      await provider.closeMergeRequest(
        docu.providerId,
        req.pullRequest,
      );
    } else {
      // If has conflicts, throw error as we cannot merge automatically
      if (mergeReq.hasConflicts) {
        throw Error('This branch cannot be merged due to conflicts. Please resolve them manually.');
      }

      await provider.merge(
        docu.providerId,
        req.pullRequest,
      );
    }

    req.state = proofreadingStates.merged;
    req.save();

    return req;
  }

  /**
   * Saves the edited page and adds it to the modified file list
   * @param {number} reqId The id of the request
   * @param {string} page The file path
   * @returns {ProofreadingRequest} The modified proofreading request
   */
  static async savePage(reqId, page) {
    const req = await ProofreadingRequest.get(reqId);
    if (req.modified.indexOf(page) === -1) {
      req.modified.push(page);
    }
    req.state = proofreadingStates.inprogress;
    await req.save();
    return req;
  }

  /**
   * Returns all requests related to the currently logged in user.
   * @returns {ProofreadingRequest[]} Array of current users proofreading requests
   */
  async getUserRequests() {
    return ProofreadingRequest.getUserRequests(this.user.id);
  }

  /**
   * Gets an array of proofrading requests related to the selected documentation.
   * If the user is author or lower, only their assigned requests are returned.
   * @param {number} docuId The documentation ID
   * @returns {ProofreadingRequest[]} Array of found proofreading requests
   */
  async getDocuRequests(docuId) {
    const perm = Role.get(this.user.id, docuId);

    if (perm.level === accessLevels.manager || perm.level === accessLevels.admin) {
      return ProofreadingRequest.getDocuRequests(docuId);
    }

    return ProofreadingRequest.getDocuRequests(docuId, this.user.id);
  }
}
