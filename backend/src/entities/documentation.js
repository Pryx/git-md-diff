import sql from '../db';
import Role from './role';
import User from './user';

const defaults = {
  id: -1,
  provider: '',
  providerId: '',
  name: '',
  description: '',
  slug: '',
};

/**
 * This class is used to represent the Documentation and access the database.
 */
export default class Documentation {
  /**
   * Creates a new Documentation instance
   * @param {Object} params The constructor parameters
   * @param {number} params.id The documentation ID
   * @param {string} params.provider The documentation provider
   * @param {string} params.providerId The providers internal ID
   * @param {string} params.name The documentation name
   * @param {string} params.slug The documentation slug
   * @param {string} params.description The documentation description
   */
  constructor(params = {}) {
    this.id = params.id || defaults.id;
    this.provider = params.provider || defaults.provider;
    this.providerId = params.providerId || params.providerid || defaults.providerId;
    this.name = params.name || defaults.name;
    this.slug = params.slug || defaults.slug;
    this.description = params.description || defaults.description;
  }

  /**
   * Gets the Documentation by its ID
   * @param {number} id The documentation ID
   * @returns {Documentation} The resulting documentation
   */
  static async get(id) {
    const [docu] = await sql`SELECT * FROM documentations WHERE id=${id}`;
    return new Documentation(docu);
  }

  /**
   * Returns the documentation based on the provider and provider id combination
   * @param {string} provider The provider the documentation is hosted at
   * @param {string} providerId The internal provider ID
   * @returns {(Documentation|null)} Returns a Documentation instance if successfully found
   */
  static async getByProviderId(provider, providerId) {
    const results = await sql`SELECT * FROM documentations WHERE provider=${provider} AND providerId=${providerId}`;

    if (results.count) {
      const [docu] = results;
      return new Documentation(docu);
    }

    return null;
  }

  /**
   * Returns all the documentation provider IDs of documentation the user has access to
   * We can limit it to the documentations the user has access to only, because
   * we do not allow anyone other than the owner to import the documentation.
   * @param {number} userId ID of the user
   * @param {string} provider The provider the documentation is hosted at
   * @returns {number[]} List of provider IDs
   */
  static async getProviderIds(userId, provider) {
    return (await sql`SELECT providerId FROM documentations WHERE id IN (SELECT docuId FROM roles WHERE userId=${userId}) AND provider=${provider}`).map((r) => r.providerid);
  }

  /**
   * Gets all documentations the user has access to
   * @param {number} userId ID of the user
   * @returns {Documentation[]} Array of documentations accessible to the user
   */
  static async getUserDocumentations(userId) {
    const results = await sql`SELECT * FROM documentations WHERE id IN (SELECT docuId FROM roles WHERE userId=${userId})`;

    if (results.count) {
      const docus = await Promise.all(
        results.map(async (docu) => {
          const d = new Documentation(docu);
          d.accessLevel = await d.getAccessLevel(userId);
          return d;
        }),
      );
      return docus;
    }

    return [];
  }

  /**
   * Gets a list of users that have access to the documentation
   * @param {number} docuId ID of the documentation
   * @returns {User[]} Array of the users having access
   */
  static async getUsers(docuId) {
    const results = await sql`SELECT userId, level FROM roles WHERE docuId=${docuId}`;

    if (results.count) {
      const users = await Promise.all(
        results.map(async (r) => {
          const user = (await User.getById(r.userid)).getPublic();
          user.accessLevel = r.level;
          return user;
        }),
      );
      return users;
    }

    return [];
  }

  /**
   * Gets the access level assigned to the user
   * @param {number} userId ID of the user
   * @returns {accessLevel} The numeric access level value
   */
  async getAccessLevel(userId) {
    const role = await Role.get(userId, this.id);
    return role.level;
  }

  /**
   * Removes the documentation by ID
   * @param {number} docuId The documentation ID
   * @returns The postgresql result
   */
  static async remove(docuId) {
    await Role.removeAll(docuId);
    return sql`DELETE FROM documentations WHERE id=${docuId}`;
  }

  /**
   * Saves the updated documentation
   * @returns The postgresql result
   */
  async save() {
    return sql`INSERT INTO documentations (provider, providerId, name, slug, description) 
      VALUES (${this.provider}, ${this.providerId}, ${this.name}, ${this.slug}, ${this.description})  
      ON CONFLICT (provider, providerId) DO UPDATE SET name=${this.name}, slug=${this.slug}, description=${this.description} RETURNING *;`;
  }
}
