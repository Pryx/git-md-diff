import PropTypes from 'prop-types';
import User from './user';

/**
 * The proofreading request shape
 */
export default {
  id: PropTypes.number,
  docuId: PropTypes.number,
  title: PropTypes.string,
  sourceBranch: PropTypes.string,
  targetBranch: PropTypes.string,
  description: PropTypes.string,
  revFrom: PropTypes.string,
  revTo: PropTypes.string,
  requester: PropTypes.shape(User),
  proofreader: PropTypes.shape(User),
  pullRequest: PropTypes.string,
  modified: PropTypes.arrayOf(PropTypes.string),
  excluded: PropTypes.arrayOf(PropTypes.string),
  state: PropTypes.number,
};
