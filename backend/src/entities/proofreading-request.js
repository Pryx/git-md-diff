import sql from '../db';
import proofreadingStates from './proofreading-states';
import User from './user';

const defaults = {
  id: -1,
  docuId: -1,
  title: '',
  sourceBranch: '',
  targetBranch: '',
  description: '',
  revFrom: '',
  revTo: '',
  requester: -1,
  proofreader: -1,
  pullRequest: '',
  modified: [],
  excluded: [],
  state: proofreadingStates.new,
};

/**
 * This class is used to represent the Proofreading request and access the database.
 */
export default class ProofreadingRequest {
  /**
   * Creates a new ProofreadingRequest instance
   * @param {Object} params The constructor parameters
   * @param {number} params.id The ID of the proofreading request
   * @param {number} params.docuId The related documentation ID
   * @param {string} params.title The proofreading request title
   * @param {string} params.sourceBranch The branch created for the proofreading request
   * @param {string} params.targetBranch The branch in which the request will be merged
   * @param {string} params.description The proofreading request description
   * @param {string} params.revFrom The starting revision identifier
   * @param {string} params.revTo The ending revision identifier
   * @param {User|number} params.requester Object or ID of the user which requested the proofreading
   * @param {User|number} params.proofreader Object or ID of the user which proofreads the pages
   * @param {string[]} params.excluded List of excluded files
   * @param {string[]} params.modified List of modified files
   * @param {string} params.pullRequest The providers internal ID of the merge request
   * @param {proofreadingStates} params.state State of the proofreading request
   */
  constructor(params = {}) {
    this.id = params.id || defaults.id;
    this.docuId = params.docuId || params.docuid || defaults.docuId;
    this.title = params.title || defaults.title;
    this.sourceBranch = params.sourceBranch || params.sourcebranch || defaults.sourceBranch;
    this.targetBranch = params.targetBranch || params.targetbranch || defaults.targetBranch;
    this.description = params.description || defaults.description;
    this.revFrom = params.revFrom || params.revfrom || defaults.revFrom;
    this.revTo = params.revTo || params.revto || defaults.revTo;
    this.requester = params.requester || defaults.requester;
    this.proofreader = params.proofreader || defaults.proofreader;
    this.excluded = params.excluded || defaults.excluded;
    this.modified = params.modified || defaults.modified;
    this.pullRequest = params.pullRequest || params.pullrequest || defaults.pullRequest;
    this.state = params.state || defaults.state;
  }

  /**
   * Gets the proofreading request complete with the proofreader and requester
   * parameters replaced by public data of the related users
   * @param {number} id The proofreading request ID
   * @returns {ProofreadingRequest} the found proofreading request
   */
  static async get(id) {
    const [req] = await sql`SELECT * FROM proofreading_requests WHERE id=${id}`;
    const r = new ProofreadingRequest(req);

    r.proofreader = (await User.getById(r.proofreader)).getPublic();
    r.requester = (await User.getById(r.requester)).getPublic();

    return r;
  }

  /**
   * Returns all request related to a documentation and optionally
   * assigned to a specific user.
   * @param {number} docuId ID of the documentation
   * @param {number} [userId = null] Optional ID of the user
   * @returns {ProofreadingRequest[]} Array of found proofreading requests
   */
  static async getDocuRequests(docuId, userId = null) {
    let results;
    if (userId) {
      results = await sql`SELECT * FROM proofreading_requests WHERE 
        docuId=${docuId} AND 
        (requester=${userId} OR proofreader=${userId}) AND 
        state!=${proofreadingStates.merged} 
        ORDER BY id DESC`;
    } else {
      results = await sql`SELECT * FROM proofreading_requests 
        WHERE docuId=${docuId} AND state!=${proofreadingStates.merged} 
        ORDER BY id DESC`;
    }

    if (results.count) {
      const reqs = await Promise.all(
        results.map(async (req) => {
          const r = new ProofreadingRequest(req);
          r.proofreader = (await User.getById(r.proofreader)).getPublic();
          r.requester = (await User.getById(r.requester)).getPublic();
          return r;
        }),
      );
      return reqs;
    }

    return [];
  }

  /**
   * Gets all requests related to a user
   * @param {number} userId The ID of the user
   * @returns {ProofreadingRequest[]} Array of found proofreading requests
   */
  static async getUserRequests(userId) {
    const results = await sql`SELECT * FROM proofreading_requests WHERE (requester=${userId} OR proofreader=${userId}) AND state!=${proofreadingStates.merged} ORDER BY id DESC`;

    if (results.count) {
      const reqs = await Promise.all(
        results.map(async (req) => {
          const r = new ProofreadingRequest(req);
          r.proofreader = (await User.getById(r.proofreader)).getPublic();
          r.requester = (await User.getById(r.requester)).getPublic();
          return r;
        }),
      );
      return reqs;
    }

    return [];
  }

  /**
   * Removes the proofreading request by ID
   * @param {number} reqId ID of the proofreading request
   * @returns The postgresql result
   */
  static async remove(reqId) {
    return sql`DELETE FROM proofreading_requests WHERE id=${reqId}`;
  }

  /**
   * Saves the updated proofreading request
   * @returns The postgresql result
   */
  async save() {
    const proofreader = this.proofreader.id || this.proofreader;
    const requester = this.requester.id || this.requester;

    if (this.id !== -1) {
      return sql`UPDATE proofreading_requests SET 
      docuId=${this.docuId}, title=${this.title}, sourceBranch=${this.sourceBranch}, targetBranch=${this.targetBranch}, description=${this.description}, 
      revFrom=${this.revFrom}, revTo=${this.revTo}, proofreader=${proofreader}, excluded=${sql.array(this.excluded)},
      modified=${sql.array(this.modified)}, pullRequest=${this.pullRequest}, state=${this.state} WHERE id=${this.id};`;
    }

    return sql`INSERT INTO proofreading_requests (
      docuId, title, sourceBranch, targetBranch, description, revFrom, revTo, 
      requester, proofreader, excluded, modified, pullRequest, state
      ) VALUES (
        ${this.docuId}, ${this.title}, ${this.sourceBranch}, ${this.targetBranch}, ${this.description}, 
        ${this.revFrom}, ${this.revTo}, ${requester}, ${proofreader}, 
        ${sql.array(this.excluded)}, ${sql.array(this.modified)}, ${this.pullRequest}, ${this.state}
      ) RETURNING *;`;
  }
}
