import ProofreadingRequest from '../../src/entities/proofreading-request';
import proofreadingStates from '../../src/entities/proofreading-states';

jest.mock('../../src/db', () => {});

describe('Proofreading request tests', () => {
  it('Test empty', () => {
    expect(new ProofreadingRequest()).toMatchObject({
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
    });
  });

  it('Test basic', () => {
    expect(new ProofreadingRequest({
      id: 29,
      docuId: 8,
      title: 'Test',
      sourceBranch: 'b1',
      targetBranch: 'b2',
      description: 'Descr',
      revFrom: 'fr',
      revTo: 'to',
      requester: 5,
      proofreader: 29,
      pullRequest: 'proofreading',
      modified: ['test1'],
      excluded: ['test2', 'test3'],
      state: proofreadingStates.merged,
    })).toMatchObject({
      id: 29,
      docuId: 8,
      title: 'Test',
      sourceBranch: 'b1',
      targetBranch: 'b2',
      description: 'Descr',
      revFrom: 'fr',
      revTo: 'to',
      requester: 5,
      proofreader: 29,
      pullRequest: 'proofreading',
      modified: ['test1'],
      excluded: ['test2', 'test3'],
      state: proofreadingStates.merged,
    });
  });

  it('Test lowercase', () => {
    expect(new ProofreadingRequest({
      id: 29,
      docuid: 8,
      title: 'Test',
      sourcebranch: 'b1',
      targetbranch: 'b2',
      description: 'Descr',
      revfrom: 'fr',
      revto: 'to',
      requester: 5,
      proofreader: 29,
      pullrequest: 'proofreading',
      modified: ['test1'],
      excluded: ['test2', 'test3'],
      state: proofreadingStates.merged,
    })).toMatchObject({
      id: 29,
      docuId: 8,
      title: 'Test',
      sourceBranch: 'b1',
      targetBranch: 'b2',
      description: 'Descr',
      revFrom: 'fr',
      revTo: 'to',
      requester: 5,
      proofreader: 29,
      pullRequest: 'proofreading',
      modified: ['test1'],
      excluded: ['test2', 'test3'],
      state: proofreadingStates.merged,
    });
  });
});
