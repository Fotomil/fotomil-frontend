import client from './client';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  branding_name: string | null;
  branding_logo_url: string | null;
  created_at: string;
}

export async function login(email: string, password: string, rememberMe: boolean = false): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', { email, password, remember_me: rememberMe });
  return res.data;
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  return res.data;
}

export async function getMe(): Promise<UserResponse> {
  const res = await client.get<UserResponse>('/auth/me');
  return res.data;
}
