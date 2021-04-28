import Documentation from '../entities/documentation';
import ProofreadingRequest from '../entities/proofreading-request';
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

    return req.save();
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
      `Finished proofreading request nr. ${req.id}`,
    );

    req.pullRequest = response.iid;
    req.save();

    return response;
  }

  async merge(reqId) {
    const req = await ProofreadingRequest.get(reqId);

    const docu = await Documentation.get(req.docuId);

    const provider = new ProviderWrapper(docu.provider, this.user.tokens);

    const response = await provider.merge(
      docu.providerId,
      req.pullRequest,
    );

    req.pullRequest = -1;
    req.save();

    return response;
  }

  static async savePage(reqId, page) {
    const req = await ProofreadingRequest.get(reqId);
    if (req.modified.indexOf(page) === -1) {
      req.modified.push(page);
    }
    return req.save();
  }

  async getUserRequests() {
    return ProofreadingRequest.getUserRequests(this.user.id);
  }
}
