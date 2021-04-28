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

  static async findOrCreate(profile, accessToken, refreshToken, provider) {
    let u = await User.getByProviderId(profile.id, provider);

    if (u) {
      if (!u.email) {
        await u.updateEmail(profile.emails[0].value);
      }

      u.updateTokens(provider, accessToken, refreshToken);
      u.save();
      return u;
    }

    //* This is needed if user is not assigned to this provider ID, but already added in the system
    for (const email of profile.emails) {
      u = await User.getByEmail(email);
      if (u !== null) {
        break;
      }
    }

    u = u || {};// Init to empty object so that we can access it and not throw

    // Create or update user
    const linked = u.linked || {};
    linked[provider] = profile.id;
    const tokens = u.tokens || {};
    tokens[provider] = { access: accessToken, refresh: refreshToken };

    const email = u.email || profile.emails[0].value;
    const name = u.name || profile.displayName;

    const user = new User({
      email, name, linked, tokens,
    });

    await user.save();
    return User.getByProviderId(profile.id, provider);
  }

  updateTokens(provider, access, refresh) {
    this.tokens[provider] = this.tokens[provider] || {};
    this.tokens[provider].access = access;
    this.tokens[provider].refresh = refresh;
  }

  updateEmail(email) {
    this.email = email;

    return sql`UPDATE users SET email=${this.email} WHERE id=${this.id}`;
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
