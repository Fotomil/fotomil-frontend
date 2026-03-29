import client from './client';

export interface Gallery {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_image_id: string | null;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export async function getGalleries(): Promise<Gallery[]> {
  const res = await client.get<{ galleries: Gallery[] }>('/galleries');
  return res.data.galleries;
}

export async function getGallery(id: string): Promise<Gallery> {
  const res = await client.get<Gallery>(`/galleries/${id}`);
  return res.data;
}

export async function createGallery(name: string, description?: string): Promise<Gallery> {
  const res = await client.post<Gallery>('/galleries', { name, description });
  return res.data;
}

export async function updateGallery(id: string, data: { name?: string; description?: string; cover_image_id?: string }): Promise<Gallery> {
  const res = await client.patch<Gallery>(`/galleries/${id}`, data);
  return res.data;
}

export async function deleteGallery(id: string): Promise<void> {
  await client.delete(`/galleries/${id}`);
}
