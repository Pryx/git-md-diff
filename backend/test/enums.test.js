import accessLevels from '../src/entities/access-levels';
import proofreadingStates from '../src/entities/proofreading-states';

describe('Enum tests', () => {
  it('Access levels should be frozen', () => {
    expect(() => { accessLevels.admin = 9; }).toThrow();
    expect(() => { accessLevels.x = 1; }).toThrow();
  });

  it('Proofreading states should be frozen', () => {
    expect(() => { proofreadingStates.merged = 9; }).toThrow();
    expect(() => { proofreadingStates.x = 1; }).toThrow();
  });

  it('Access levels should be unchanged', () => {
    expect(accessLevels).toMatchObject({
      admin: 1, manager: 2, author: 3, proofreader: 4,
    });
  });

  it('Proofreading states should be unchanged', () => {
    expect(proofreadingStates).toMatchObject({
      new: 1, inprogress: 2, submitted: 3, merged: 4, rejected: 5,
    });
  });
});
