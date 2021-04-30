import ky from 'ky';
import { store } from '../store';
import { logOut, tokensReceived } from '../actions';

export const secureKy = () => {
  const state = store.getState();

  const { token, refreshToken } = state;

  const kyInst = ky.extend({
    headers: {
      Authorization: `JWT ${token}`,
      RefreshToken: refreshToken,
    },
  });

  return kyInst;
};

export const refreshTokens = async () => {
  try {
    const json = await secureKy().get(`${window.env.api.backend}/auth/token`).json();
    if (json.data) {
      store.dispatch(tokensReceived(json.data));
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      store.dispatch(logOut());
    } else {
      console.error('Error refreshing tokens:', error);
    }
  }
};
