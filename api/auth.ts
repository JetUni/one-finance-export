import { readFileSync, writeFileSync } from 'fs';
import { OneUserSession, RefreshTokenResponse } from '../models/session.interface';

const sessionFileName = './db/one-user-session.json';
const refreshUrl = 'https://partner-auth.one.app/cookieless/refresh';

let oneUserSession: OneUserSession | undefined;
export let userId: string | undefined;
export let token: string | undefined;
export let refreshToken: string | undefined;

export async function loadUserSession() {
  try {
    const currentTime = new Date().getTime();
    const sessionString = readFileSync(sessionFileName).toString();
    oneUserSession = JSON.parse(sessionString);

    if (!oneUserSession) {
      console.warn('missing one user session');
      process.exit(1);
    }

    userId = oneUserSession.userId;
    token = oneUserSession.token.accessToken;
    refreshToken = oneUserSession.token.refreshToken;

    if (currentTime > oneUserSession.expirationTime) {
      await fetchNewToken();
    }
  } catch (error) {
    console.log(userId, token, refreshToken);
    console.error(error);
    process.exit(1);
  }
}

export async function fetchNewToken(): Promise<void> {
  try {
    if (!oneUserSession) {
      console.error('missing user session', 'please copy from website');
    }
    console.log('refreshing token');
    const options: RequestInit = {
      body: JSON.stringify({
        platform: 'NATIVE_WEB_APP',
        refresh_token: refreshToken,
      }),
      headers: new Headers([
        ['X-Safe-Request-ID', '66fe1e2b-1aa4-44f4-8814-948a608a1e0b'],
        ['content-type', 'application/json'],
      ]),
      method: 'POST',
    };
    const response = await fetch(refreshUrl, options);
    // console.log(response.ok, response.status, response.statusText);
    const created = new Date();

    if (response.ok) {
      const userSession: RefreshTokenResponse = await response.json();
      // console.log('user session', userSession);

      oneUserSession!.token = {
        accessToken: userSession.access_token,
        expiresIn: userSession.expires_in,
        idToken: userSession.id_token,
        refreshToken: refreshToken as string,
        scope: userSession.scope,
        tokenType: userSession.token_type,
      };
      oneUserSession!.createdTime = created.getTime();
      oneUserSession!.expirationTime = created.getTime() + userSession.expires_in * 1000;

      token = userSession.access_token;

      writeFileSync(sessionFileName, JSON.stringify(oneUserSession));
    } else {
      console.log(await response.text());
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
