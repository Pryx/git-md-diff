/**
 * Logs the user in and adds the user data to the store
 * @param {Object} payload User object
 * @returns {Object} action descriptor
 */
export function logIn(payload) {
  return { type: 'LOGIN', payload };
}

/**
 * Adds the tokens to the store
 * @param {Object} payload The received JWT
 * @returns {Object} action descriptor
 */
export function tokensReceived(payload) {
  return { type: 'TOKENS_RECEIVED', payload };
}

/**
 * Logs the user out and resets the stored state
 * @returns {Object} action descriptor
 */
export function logOut() {
  return { type: 'LOGOUT' };
}

/**
 *
 * @param {string} payload The selected revision identifier
 * @returns {Object} action descriptor
 */
export function revisionSelected(payload) {
  return { type: 'REVISION_SELECTED', payload };
}

/**
 * Updates the selected documentation ID
 * @param {number} payload The selected documentation identifier
 * @returns {Object} action descriptor
 */
export function documentationSelected(payload) {
  return { type: 'DOCUMENTATION_SELECTED', payload };
}

/**
 * Indicates that the documentation is empty
 * @returns {Object} action descriptor
 */
export function documentationEmpty() {
  return { type: 'DOCUMENTATION_EMPTY' };
}

/**
 * Saves the page to the persisted state
 * @param {number} docuId The documentation ID
 * @param {string} page The page path
 * @param {string} content The page content
 * @returns {Object} action descriptor
 */
export function pageAutosave(docuId, page, content) {
  return { type: 'PAGE_AUTOSAVE', payload: { docuId, page, content } };
}

/**
 * Removes the autosaved page from persisted state
 * @param {number} docuId The documentation ID
 * @param {string} page The page path
 * @returns {Object} action descriptor
 */
export function pageAutosaveRemove(docuId, page) {
  return { type: 'PAGE_AUTOSAVE_REMOVE', payload: { docuId, page } };
}

/**
 * Updates the displayed change list
 * @param {Object[]} payload Array of changes
 * @returns {Object} action descriptor
 */
export function updateChangesList(payload) {
  return { type: 'CHANGES_UPDATE', payload };
}

/**
 * Excludes the file specified
 * @param {string} payload The file to exclude
 * @returns {Object} action descriptor
 */
export function excludeChange(payload) {
  return { type: 'CHANGE_EXCLUDE', payload };
}

/**
 * Includes the file specified
 * @param {string} payload The file to include
 * @returns {Object} action descriptor
 */
export function includeChange(payload) {
  return { type: 'CHANGE_INCLUDE', payload };
}
