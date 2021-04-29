import PropTypes from 'prop-types';
import User from './user';

/* eslint-disable */
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
  }


  static getShape(){
    return {
      id: PropTypes.number,
      docuId: PropTypes.number,
      title: PropTypes.string,
      sourceBranch: PropTypes.string,
      targetBranch: PropTypes.string,
      description: PropTypes.string,
      revFrom: PropTypes.string,
      revTo: PropTypes.string,
      requester: PropTypes.shape(User.getShape()),
      proofreader: PropTypes.shape(User.getShape()),
      pullRequest: PropTypes.string,
      modified: PropTypes.arrayOf(PropTypes.string),
      excluded: PropTypes.arrayOf(PropTypes.string),
    };
  }

  static async get(id) {
  }

  static async getUserRequests(userId) {
  }

  static async remove(docuId) {
  }

  async save() {
  }
}
