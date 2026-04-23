import axios from 'axios';
import type { Order } from './orders';

const STORAGE_KEY = 'lab_token';

const labClient = axios.create({ baseURL: '/api' });

labClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setLabToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function getLabToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearLabToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export interface LabMe {
  id: string;
  name: string;
  email: string;
}

export async function sendLabLoginLink(email: string): Promise<void> {
  await labClient.post('/lab/login', { email });
}

export async function getLabMe(): Promise<LabMe> {
  const res = await labClient.get<LabMe>('/lab/me');
  return res.data;
}

export async function getLabOrders(): Promise<Order[]> {
  const res = await labClient.get<Order[]>('/lab/orders');
  return res.data;
}

export async function updateLabOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await labClient.patch<Order>(`/lab/orders/${orderId}/status`, { status });
  return res.data;
}

export function getLabDownloadUrl(orderId: string): string {
  const token = getLabToken();
  return `/api/lab/orders/${orderId}/download?token=${token}`;
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
  const res = await labClient.get<LabProduct[]>('/lab/products');
  return res.data;
}

export async function addLabProduct(data: { name: string; price: number; currency?: string; sort_order?: number }): Promise<LabProduct> {
  const res = await labClient.post<LabProduct>('/lab/products', data);
  return res.data;
}

export async function updateLabProduct(productId: string, data: Record<string, unknown>): Promise<LabProduct> {
  const res = await labClient.patch<LabProduct>(`/lab/products/${productId}`, data);
  return res.data;
}

export async function deleteLabProduct(productId: string): Promise<void> {
  await labClient.delete(`/lab/products/${productId}`);
}
