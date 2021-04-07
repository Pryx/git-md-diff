import RefreshToken from '../entities/refresh-token';
import User from '../entities/user';

export default class Auth {
  static async findOrCreateUser(profile, accessToken, refreshToken) {
    return User.findOrCreate(profile, accessToken, refreshToken);
  }

  static async loginUser(userId, hash, expire) {
    const token = new RefreshToken({ userId, hash, expire });
    token.remove();
  }

  static async logoutUser(userId, hash) {
    const token = new RefreshToken({ userId, hash });
    token.remove();
  }
}
