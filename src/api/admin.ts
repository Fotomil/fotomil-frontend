import client from './client';
import type { Lab, LabProduct } from './labs';

export async function checkAdmin(): Promise<boolean> {
  const res = await client.get<{ is_admin: boolean }>('/admin/check');
  return res.data.is_admin;
}

export async function getAdminLabs(): Promise<Lab[]> {
  const res = await client.get<Lab[]>('/admin/labs');
  return res.data;
}

export async function createLab(data: { name: string; email: string; address?: string; phone?: string; website?: string }): Promise<Lab> {
  const res = await client.post<Lab>('/admin/labs', data);
  return res.data;
}

export async function updateLab(labId: string, data: Record<string, unknown>): Promise<Lab> {
  const res = await client.patch<Lab>(`/admin/labs/${labId}`, data);
  return res.data;
}

export async function deleteLab(labId: string): Promise<void> {
  await client.delete(`/admin/labs/${labId}`);
}

export async function addLabProduct(labId: string, data: { name: string; price: number; currency?: string }): Promise<LabProduct> {
  const res = await client.post<LabProduct>(`/admin/labs/${labId}/products`, data);
  return res.data;
}

export async function updateLabProduct(productId: string, data: Record<string, unknown>): Promise<LabProduct> {
  const res = await client.patch<LabProduct>(`/admin/products/${productId}`, data);
  return res.data;
}

export async function deleteLabProduct(productId: string): Promise<void> {
  await client.delete(`/admin/products/${productId}`);
}
