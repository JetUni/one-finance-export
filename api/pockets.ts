import { Pocket } from '../models/pockets.interface';

const pocketsUrl = 'https://api.one.app/banking/v2/pockets';

export async function fetchPockets(userId: string, token: string): Promise<Pocket[]> {
  const options = {
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['X-Safe-Request-ID', '66fe1e2b-1aa4-44f4-8814-948a608a1e0b'],
    ]),
  };
  const response = await fetch(pocketsUrl + `?user_id=${userId}`, options);
  // console.log(response.ok, response.status, response.statusText);

  if (response.ok) {
    const pockets = await response.json();
    console.log('pockets', pockets.length);
    return pockets;
  } else {
    console.log(await response.text());
    return [];
  }
}
