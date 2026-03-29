import client from './client';

export interface ShareLink {
  id: string;
  gallery_id: string;
  token: string;
  permission: 'view' | 'edit';
  label: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getShareLinks(galleryId: string): Promise<ShareLink[]> {
  const res = await client.get<ShareLink[]>(`/galleries/${galleryId}/shares`);
  return res.data;
}

export async function createShareLink(
  galleryId: string,
  permission: 'view' | 'edit',
  label?: string,
  expiresAt?: string
): Promise<ShareLink> {
  const res = await client.post<ShareLink>(`/galleries/${galleryId}/shares`, {
    permission,
    label: label || null,
    expires_at: expiresAt || null,
  });
  return res.data;
}

export async function updateShareLink(
  shareId: string,
  data: { is_active?: boolean; label?: string }
): Promise<ShareLink> {
  const res = await client.patch<ShareLink>(`/shares/${shareId}`, data);
  return res.data;
}

export async function deleteShareLink(shareId: string): Promise<void> {
  await client.delete(`/shares/${shareId}`);
}
