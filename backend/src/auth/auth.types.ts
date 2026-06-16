export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

/** The authenticated principal attached to the request by JwtStrategy. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user: AuthUser;
}
