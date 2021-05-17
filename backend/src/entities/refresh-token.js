import sql from '../db';

const defaults = {
  userId: '',
  hash: '',
  expire: 0,
};

/**
 * This class is used to represent the refresh token and access the database.
 */
export default class RefreshToken {
  /**
   * Creates a new ProofreadingRequest instance
   * @param {Object} params The constructor parameters
   * @param {number} params.userId The ID of the user who owns this token
   * @param {string} params.hash The token hash
   * @param {number} params.expire The token expiration time
   */
  constructor(params) {
    this.userId = params.userId || defaults.userId;
    this.hash = params.hash || defaults.hash;
    this.expire = params.expire || defaults.expire;
  }

  /**
   * Gets the refresh token by the user ID and hash
   * @param {number} userId ID of the user owning this token
   * @param {string} hash The token hash
   * @returns {RefreshToken} The refresh token
   */
  static async get(userId, hash) {
    const [res] = await sql`SELECT * FROM tokens WHERE userId=${userId} AND hash=${hash}`;
    const token = new RefreshToken(res || {});
    return token;
  }

  /**
   * Removes the refresh token by the user ID and hash
   * @param {number} userId ID of the user owning this token
   * @param {string} hash The token hash
   * @returns The postgresql result
   */
  static async remove(userId, hash) {
    return sql`DELETE FROM tokens WHERE userId=${userId} AND hash=${hash}`;
  }

  /**
   * Saves the updated refresh token
   * @returns The postgresql result
   */
  async save() {
    return sql`INSERT INTO tokens (userId, hash, expire) VALUES (${this.userId}, ${this.hash},${this.expire}) RETURNING *`;
  }
}
