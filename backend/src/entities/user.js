import sql from '../db';

const defaults = {
  id: null,
  email: '',
  name: '',
  linked: {},
  tokens: {},
};

/**
 * This class is used to represent the User and access the database.
 */
export default class User {
  /**
   * Creates a new User instance
   * @param {Object} params The constructor parameters
   * @param {accessLevel} params.level The numeric value of the access level
   * @param {number} params.docuId The documentation ID
   * @param {number} params.userId The user ID
   * @param {number} params.userId The user ID
   * @param {number} params.userId The user ID
   */
  constructor(params) {
    this.id = params.id || defaults.id;
    this.email = params.email || defaults.email;
    this.name = params.name || defaults.name;
    this.tokens = params.tokens || defaults.tokens;
    this.linked = params.linked || defaults.linked;
  }

  /**
   * Searches for the user by email
   * @param {string} email the users email
   * @returns {(User|null)} the found user
   */
  static async getByEmail(email) {
    const result = await sql`SELECT * FROM users WHERE email=${email}`;
    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  /**
   * Searches for the user by ID
   * @param {number} id the users ID
   * @returns {(User|null)} the found user
   */
  static async getById(id) {
    const result = await sql`SELECT * FROM users WHERE id=${id}`;
    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  /**
   * Searches for the user by the provider ID
   * @param {*} id The provider ID
   * @param {*} provider The provider slug
   * @returns {(User|null)} the found user
   */
  static async getByProviderId(id, provider) {
    const result = await sql`SELECT * FROM users WHERE linked->>'${sql(provider)}'=${id}`;

    if (result.count) {
      const [user] = result;
      return new User(user);
    }
    return null;
  }

  /**
   * Tries to find the user, if not found, creates it
   * @param {Object} profile The profile object obtained from the hosting service
   * @param {string} accessToken The access token obtained from the hosting service
   * @param {string} refreshToken The refresh token obtained from the hosting service
   * @param {string} provider The hosting service provider
   * @returns {User} the user object
   */
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
    const users = profile.emails.map((email) => User.getByEmail(email));

    await Promise.all(users);

    u = users.find((el) => el !== undefined && el !== null);

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

  /**
   * Modifies the token field of an user
   * @param {string} provider The provider slug
   * @param {string} access The access token
   * @param {string} refresh The refresh token
   */
  updateTokens(provider, access, refresh) {
    this.tokens[provider] = this.tokens[provider] || {};
    this.tokens[provider].access = access;
    this.tokens[provider].refresh = refresh;
  }

  /**
   * Updates the current users email in the database
   * @returns The postgresql result
   */
  updateEmail(email) {
    this.email = email;

    return sql`UPDATE users SET email=${this.email} WHERE id=${this.id}`;
  }

  /**
   * Saves the updated user
   * @returns The postgresql result
   */
  async save() {
    return sql`INSERT INTO users (email, name, linked, tokens) VALUES (${this.email}, ${this.name},${sql.json(this.linked)}, ${sql.json(this.tokens)}) ON CONFLICT (email) DO
    UPDATE SET name=${this.name}, linked=${sql.json(this.linked)}, tokens=${sql.json(this.tokens)} RETURNING *`;
  }

  /**
   * Gets the public version of the user data
   * @returns Public user data
   */
  getPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
    };
  }
}
