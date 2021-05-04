import accessLevels from '../entities/access-levels';
import Documentation from '../entities/documentation';
import ProofreadingRequest from '../entities/proofreading-request';
import proofreadingStates from '../entities/proofreading-states';
import Role from '../entities/role';
import ProviderWrapper from '../providers/provider-wrapper';

export default class ProofreadingService {
  constructor(user) {
    this.user = user;
  }

  async create(params) {
    const req = new ProofreadingRequest(params);

    const docu = await Documentation.get(req.docuId);

    // TODO: Probably create branch or something...
    const provider = new ProviderWrapper(docu.provider, this.user.tokens); //eslint-disable-line
    const savedReq = new ProofreadingRequest(...await req.save());

    await provider.createBranch(docu.providerId, `git-md-proofreading-${savedReq.id}`, savedReq.revTo);
    savedReq.sourceBranch = `git-md-proofreading-${savedReq.id}`;
    await savedReq.save();
    return savedReq;
  }

  async get(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    if (req.proofreader.id !== this.user.id && req.requester.id !== this.user.id) {
      throw Error('Not authorized to access this proofreading request.');
    }

    return req;
  }

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

    return response;
  }

  async merge(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    const docu = await Documentation.get(req.docuId);

    const provider = new ProviderWrapper(docu.provider, this.user.tokens);
    const mergeReq = await provider.getMergeRequest(
      docu.providerId,
      req.pullRequest,
    );

    if (mergeReq.changesCount === null){
      await provider.closeMergeRequest(
        docu.providerId,
        req.pullRequest,
      );
    } else {
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

  static async savePage(reqId, page) {
    const req = await ProofreadingRequest.get(reqId);
    if (req.modified.indexOf(page) === -1) {
      req.modified.push(page);
    }
    req.state = proofreadingStates.inprogress;
    await req.save();
    return req;
  }

  async getUserRequests() {
    return ProofreadingRequest.getUserRequests(this.user.id);
  }

  async getDocuRequests(docuId) {
    const perm = Role.get(this.user.id, docuId);

    if (perm.level === accessLevels.manager || perm.level === accessLevels.admin){
      return ProofreadingRequest.getDocuRequests(docuId);
    }

    return ProofreadingRequest.getDocuRequests(docuId, this.user.id);
  }
}
