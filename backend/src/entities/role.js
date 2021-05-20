import sql from '../db';

const defaults = {
  level: -1,
  docuId: -1,
  userId: -1,
};

/**
 * This class is used to represent the role of user and access the database.
 */
export default class Role {
  /**
   * Creates a new Role instance
   * @param {Object} params The constructor parameters
   * @param {accessLevel} params.level The numeric value of the access level
   * @param {number} params.docuId The documentation ID
   * @param {number} params.userId The user ID
   */
  constructor(params = {}) {
    this.level = params.level || defaults.level;
    this.docuId = params.docuId || params.docuid || defaults.docuId;
    this.userId = params.userId || params.userid || defaults.userId;
  }

  /**
   * Gets the role of user by the user ID and documentation ID
   * @param {number} userId ID of the user owning this token
   * @param {number} docuId ID of the documentation
   * @returns {Role} the found role
   */
  static async get(userId, docuId) {
    const [res] = await sql`SELECT * FROM roles WHERE userId=${userId} AND docuId=${docuId}`;
    const role = new Role(res);
    return role;
  }

  /**
   * Removes the role of user by the user ID and documentation ID
   * @param {number} userId ID of the user owning this token
   * @param {number} docuId ID of the documentation
   * @returns The postgresql result
   */
  static async remove(userId, docuId) {
    return sql`DELETE FROM roles WHERE userId=${userId} AND docuId=${docuId}`;
  }

  /**
   * Removes all the users from documentation, used when documentation is deleted
   * @returns The postgresql result
   */
  static async removeAll(docuId) {
    return sql`DELETE FROM roles WHERE docuId=${docuId}`;
  }

  /**
   * Saves the updated role of user
   * @returns The postgresql result
   */
  async save() {
    return sql`INSERT INTO roles (userId, docuId, level) VALUES (${this.userId}, ${this.docuId},${this.level}) ON CONFLICT (userId, docuId) DO
    UPDATE SET level=${this.level} RETURNING *`;
  }
}
