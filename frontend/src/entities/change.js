/* eslint-disable */

import PropTypes from 'prop-types';

const defaults = {
  oldFile: "",
  newFile: "",
  renamed: false
};

export default class Change {
  constructor(params) {
    this.oldFile = params.oldFile || params.oldfile || defaults.oldFile;
    this.newFile = params.newFile || params.newfile || defaults.newFile;
    this.renamed = params.renamed || defaults.providerId;
  }

  static getShape() {
    return {
      oldFile: PropTypes.string,
      newFile: PropTypes.string,
      renamed: PropTypes.bool
    };
  }

  static async get(id) {
  }

  static async remove(docuId) {
  }

  async save() {
  }
}
