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
    const result = await sql`SELECT * FROM users WHERE email=${email}`;
    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  static async getById(id) {
    const result = await sql`SELECT * FROM users WHERE id=${id}`;
    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  static async getByProviderId(id, provider) {
    const result = await sql`SELECT * FROM users WHERE linked->>'${sql(provider)}'=${id}`;

    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  static async findOrCreate(profile, accessToken, refreshToken) {
    const u = await User.getByProviderId(profile.id, 'gitlab');

    if (u === null) {
      // Create user
      const user = new User({
        email: profile.emails[0].value,
        name: profile.displayName,
        linked: { gitlab: profile.id },
        tokens: { gitlab: { access: accessToken, refresh: refreshToken } },
      });
      user.save();
      return User.getByProviderId(profile.id, 'gitlab');
    }
    u.updateTokens('gitlab', accessToken, refreshToken);
    u.save();
    return u;
  }

  updateTokens(provider, access, refresh) {
    this.tokens[provider].access = access;
    this.tokens[provider].refresh = refresh;
  }

  async save() {
    return sql`INSERT INTO users (email, name, linked, tokens) VALUES (${this.email}, ${this.name},${sql.json(this.linked)}, ${sql.json(this.tokens)}) ON CONFLICT (email) DO
    UPDATE SET name=${this.name}, linked=${sql.json(this.linked)}, tokens=${sql.json(this.tokens)}`;
  }

  getPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
    };
  }
}
