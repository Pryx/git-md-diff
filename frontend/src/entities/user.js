import PropTypes from 'prop-types';

/* eslint-disable */
const defaults = {
  id: null,
  email: '',
  name: '',
};

export default class User {
  constructor(params) {
    this.id = params.id || defaults.id;
    this.email = params.email || defaults.email;
    this.name = params.name || defaults.name;
  }

  static getShape(){
    return {
      id: PropTypes.number,
      email: PropTypes.string,
      name: PropTypes.string,
    };
  }

  static async getById(id) {
  }

  static async getCurrent(){
    
  }


  async save() {
  }
}
