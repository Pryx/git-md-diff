/* eslint-disable */
const defaults = {
  level: -1,
  docuId: -1,
  userId: -1,
};

export default class Role {
  constructor(params) {
    this.level = params.level || defaults.level;
    this.docuId = params.docuId || defaults.docuId;
    this.userId = params.userId || defaults.userId;
  }

  static async get(userId, docuId) {
  }

  async remove() {
  }

  async save() {

  }
}
