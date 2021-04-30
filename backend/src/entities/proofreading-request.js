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

export default class ProofreadingRequest {
  constructor(params) {
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
    this.state = params.state || params.state || defaults.state;
  }

  static async get(id) {
    const [req] = await sql`SELECT * FROM proofreading_requests WHERE id=${id}`;
    const r = new ProofreadingRequest(req);

    r.proofreader = (await User.getById(r.proofreader)).getPublic();
    r.requester = (await User.getById(r.requester)).getPublic();

    return r;
  }

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

  static async remove(docuId) {
    return sql`DELETE FROM proofreading_requests WHERE id=${docuId}`;
  }

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
