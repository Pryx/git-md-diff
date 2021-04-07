import ky from 'ky';
import { store } from '../store';

const secureKy = () => {
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

export default secureKy;
