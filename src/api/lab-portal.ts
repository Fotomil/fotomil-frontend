import client from './client';
import type { Order } from './orders';

export interface LabMe {
  id: string;
  name: string;
  email: string;
}

export async function getLabMe(): Promise<LabMe> {
  const res = await client.get<LabMe>('/lab/me');
  return res.data;
}

export async function getLabOrders(): Promise<Order[]> {
  const res = await client.get<Order[]>('/lab/orders');
  return res.data;
}

export async function updateLabOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await client.patch<Order>(`/lab/orders/${orderId}/status`, { status });
  return res.data;
}

export function getLabDownloadUrl(orderId: string, accessToken: string): string {
  return `/api/lab/orders/${orderId}/download?token=${accessToken}`;
}

export interface LabProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  sort_order: number;
  is_active: boolean;
}

export async function getLabProducts(): Promise<LabProduct[]> {
  const res = await client.get<LabProduct[]>('/lab/products');
  return res.data;
}

export async function addLabProduct(data: { name: string; price: number; currency?: string; sort_order?: number }): Promise<LabProduct> {
  const res = await client.post<LabProduct>('/lab/products', data);
  return res.data;
}

export async function updateLabProduct(productId: string, data: Record<string, unknown>): Promise<LabProduct> {
  const res = await client.patch<LabProduct>(`/lab/products/${productId}`, data);
  return res.data;
}

export async function deleteLabProduct(productId: string): Promise<void> {
  await client.delete(`/lab/products/${productId}`);
}
