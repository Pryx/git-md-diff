/**
 * Tries to return a nice, human readable error description
 * @param {Error} error JS Error
 * @returns {string} Descriptive error string
 */
export default function descriptiveError(error){
  if (error.description){
    //If the description is an object, map it to its key and value
    if (typeof error.description === 'object' && 
        error.description !== null){
      const descr = Object.entries(error.description)
        .map(([name, value]) => value.length ? `${name} ${value}` : null).
        filter(el => el != null);

      return descr.join(', ');
    }

    // If it has description, show it
    return error.description.toString();
  }

  // Fallback
  return error.toString();
}