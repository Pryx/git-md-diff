import sql from '../db';

const defaults = {
  id: null,
  email: '',
  name: '',
  linked: {},
  tokens: {},
};

export default class User {
  constructor(params) {
    this.id = params.id || defaults.id;
    this.email = params.email || defaults.email;
    this.name = params.name || defaults.name;
    this.tokens = params.tokens || defaults.tokens;
    this.linked = params.linked || defaults.linked;
  }

  static async getByEmail(email) {
    return sql`SELECT * FROM users WHERE email=${email}`;
  }

  static async getById(id) {
    return sql`SELECT * FROM users WHERE id=${id}`;
  }

  static async getByProviderId(id, provider) {
    return sql`SELECT * FROM users WHERE linked->>'${sql(provider)}'=${id}`;
  }

  async save() {
    return sql`INSERT INTO users (email, name, linked, tokens) VALUES (${this.email}, ${this.name},${sql.json(this.linked)}, ${sql.json(this.tokens)}) ON CONFLICT (email) DO
    UPDATE SET name=${this.name}, linked=${sql.json(this.linked)}, tokens=${sql.json(this.tokens)}`;
  }
}
