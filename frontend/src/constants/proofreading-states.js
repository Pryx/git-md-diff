/**
 * This constant acts as the proofreading state string holder
 */
export const proofreadingStatesString = {
  1: 'New', 2: 'In progress', 3: 'Submitted', 4: 'Merged', 5: 'Rejected',
};
Object.freeze(proofreadingStatesString);

/**
 * This constant acts as the proofreading state enum
 */
export const proofreadingStates = {
  new: 1, inprogress: 2, submitted: 3, merged: 4, rejected: 5,
};
Object.freeze(proofreadingStates);
