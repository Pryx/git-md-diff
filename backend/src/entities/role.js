import sql from '../db';

const defaults = {
  level: 3,
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
    return sql`SELECT * FROM roles WHERE userId=${userId} AND docuId=${docuId}`;
  }

  async remove() {
    return sql`DELETE FROM roles WHERE userId=${this.userId} AND docuId=${this.docuId}`;
  }

  async save() {
    return sql`INSERT INTO roles (userId, docuId, level) VALUES (${this.userId}, ${this.docuId},${this.level}) ON CONFLICT (userId, docuId) DO
    UPDATE SET level=${this.level}`;
  }
}