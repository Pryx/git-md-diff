import User from '../entities/user';

export async function findOrCreateUser(profile, accessToken, refreshToken) {
  let u = await User.getByProviderId(profile.id, 'gitlab');

  if (u === null) {
    // Create user
    const user = new User({
      email: profile.emails[0].value,
      name: profile.displayName,
      linked: { gitlab: profile.id },
      tokens: { gitlab: { access: accessToken, refresh: refreshToken } },
    });
    user.save();
    return user;
  } else {
    u.updateTokens("gitlab", accessToken, refreshToken)
    u.save()
    return u;
  }
}