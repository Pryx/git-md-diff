/**
 * This constant acts as the user access level enum
 */
export const accessLevels = {
  admin: 1, manager: 2, author: 3, proofreader: 4,
};
Object.freeze(accessLevels);

export const accessLevelsString = {
  1: 'Admin', 2: 'Manager', 3: 'Author', 4: 'Proofreader',
};
Object.freeze(accessLevelsString);
