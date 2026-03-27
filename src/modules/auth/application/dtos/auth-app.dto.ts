export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface RegisterAppDto {
  email: string;
  name: string;
  password: string;
}

export interface LoginAppDto {
  email: string;
  password: string;
  ipAddress?: string;
}
