import sql from '../db';

const defaults = {
  userId: '',
  hash: '',
  expire: '',
};

export default class RefreshToken {
  constructor(params) {
    this.userId = params.userId || defaults.userId;
    this.hash = params.hash || defaults.hash;
    this.expire = params.expire || defaults.expire;
  }

  static async get(userId, hash) {
    const [res] = await sql`SELECT * FROM tokens WHERE userId=${userId} AND hash=${hash}`;
    const role = new RefreshToken(res);
    return role;
  }

  async remove() {
    return sql`DELETE FROM tokens WHERE userId=${this.userId} AND hash=${this.hash}`;
  }

  async save() {
    return sql`INSERT INTO tokens (userId, hash, expire) VALUES (${this.userId}, ${this.hash},${this.expire}) RETURNING *`;
  }
}
