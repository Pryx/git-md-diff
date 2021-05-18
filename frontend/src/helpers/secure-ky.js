import ky from 'ky';
import { store } from '../store';
import { logOut, tokensReceived } from '../actions';

/**
 * A ky instance with the tokens set up.
 * @returns {ky} a secure instance of ky
 */
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

/**
 * Logs the user out
 */
export const logoutUser = async () => {
  await secureKy().get(`${window.env.api.backend}/auth/logout`).json();
  store.dispatch(logOut());
};

/**
 * Performs a token check and refresh if appropriate.
 */
export const refreshTokens = async () => {
  try {
    const json = await secureKy().get(`${window.env.api.backend}/auth/token`).json();
    if (json.data) {
      console.log('TOKENS REFRESHED');
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

/**
 * Returns the error message of either the server response or the error itself.
 * @param {(HTTPError|Error)} error The possibly HTTP error
 * @returns
 */
export const getPossiblyHTTPErrorMessage = async (error) => {
  if (error.response && error.response.status === 403) {
    await logoutUser();
    return null;
  }

  if (error.response) {
    const serverError = (await error.response.json()).error || `Error code ${error.response.status}, no message`;
    return `Endpoint returned error: ${serverError}`;
  }

  return error.message || error;
};
