/* eslint-disable */
import Role from './role';
import User from './user';
import PropTypes from 'prop-types';

const defaults = {
  id: -1,
  provider: '',
  providerId: -1,
  name: '',
  description: '',
  slug: '',
};

export default class Documentation {
  constructor(params) {
    this.id = params.id || defaults.id;
    this.provider = params.provider || defaults.provider;
    this.providerId = params.providerId || params.providerid || defaults.providerId;
    this.name = params.name || defaults.name;
    this.slug = params.slug || defaults.slug;
    this.description = params.description || defaults.description;
  }

  static getShape(){
    return {
      id: PropTypes.number,
      provider: PropTypes.string,
      providerId: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string,
      slug: PropTypes.string,
    };
  }

  static async get(id) {
  }

  static async getUserDocumentations(userId) {
  }

  static async getUsers(docuId) {
  }

  static async remove(docuId) {
  }

  async save() {
  }
}
