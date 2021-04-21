import RefreshToken from '../entities/refresh-token';
import User from '../entities/user';

export default class Auth {
  static async findOrCreateUser(profile, accessToken, refreshToken, provider) {
    return User.findOrCreate(profile, accessToken, refreshToken, provider);
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
