import RefreshToken from '../entities/refresh-token';
import User from '../entities/user';

/**
 * The Auth service
 */
export default class Auth {
  /**
   * Tries to find the user, if not found, creates it
   * @param {Object} profile The profile object obtained from the hosting service
   * @param {string} accessToken The access token obtained from the hosting service
   * @param {string} refreshToken The refresh token obtained from the hosting service
   * @param {string} provider The hosting service provider
   * @returns {User} the user object
   */
  static async findOrCreateUser(profile, accessToken, refreshToken, provider) {
    return User.findOrCreate(profile, accessToken, refreshToken, provider);
  }

  /**
   * Logs the user in (adds the token hash to the database)
   * @param {number} userId the ID of the user
   * @param {string} hash the md5 hash of the token
   * @param {number} expire the expiration timestamp
   */
  static async loginUser(userId, hash, expire) {
    const token = new RefreshToken({ userId, hash, expire: expire / 1000 });
    await token.save();
  }

  /**
   * Checks whether the token is valid (in DB and not expired)
   * @param {number} userId the ID of the user
   * @param {string} hash the md5 hash of the token
   * @param {number} expire the expiration timestamp
   */
  static async refreshTokenValid(userId, hash) {
    const token = await RefreshToken.get(userId, hash);

    return token.expire > (Date.now() / 1000);
  }

  /**
   * Logs the user in (removes the token hash from the database)
   * @param {number} userId the ID of the user
   * @param {string} hash the md5 hash of the token
   */
  static async logoutUser(userId, hash) {
    await RefreshToken.remove(userId, hash);
  }
}
