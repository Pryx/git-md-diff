import sql from '../db';

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
    const [res] = await sql`SELECT * FROM roles WHERE userId=${userId} AND docuId=${docuId}`;
    const role = new Role(res);
    return role;
  }

  static async remove(userId, docuId) {
    return sql`DELETE FROM roles WHERE userId=${userId} AND docuId=${docuId}`;
  }

  static async removeAll(docuId) {
    return sql`DELETE FROM roles WHERE docuId=${docuId}`;
  }

  async save() {
    return sql`INSERT INTO roles (userId, docuId, level) VALUES (${this.userId}, ${this.docuId},${this.level}) ON CONFLICT (userId, docuId) DO
    UPDATE SET level=${this.level} RETURNING *`;
  }
}
