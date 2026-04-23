import client from './client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  branding_name: string | null;
  branding_logo_url: string | null;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Identity {
  provider: string;
  connection: string;
}

export async function getMe(): Promise<UserProfile> {
  const res = await client.get<UserProfile>('/auth/me');
  return res.data;
}

export async function updateProfile(data: Record<string, string | null>): Promise<UserProfile> {
  const res = await client.patch<UserProfile>('/auth/profile', data);
  return res.data;
}

export async function requestPasswordReset(): Promise<void> {
  await client.post('/auth/profile/change-password');
}

export async function getIdentities(): Promise<Identity[]> {
  const res = await client.get<Identity[]>('/auth/profile/identities');
  return res.data;
}

export async function deleteAccount(): Promise<void> {
  await client.delete('/auth/profile/account');
}
