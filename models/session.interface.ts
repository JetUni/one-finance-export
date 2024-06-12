export interface OneUserSession {
  createdTime: number;
  expirationTime: number;
  isStepUpToken: boolean;
  passcodeUserEmail: string;
  refreshToken: string;
  token: {
    accessToken: string;
    expiresIn: number;
    idToken: string;
    refreshToken: string;
    scope: string;
    tokenType: 'Bearer';
  };
  userId: string;
}
export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: 'Bearer';
}
