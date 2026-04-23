import axios from 'axios';
import client from './client';

const sharedClient = axios.create({ baseURL: '/api/shared' });

export interface OrderItemInput {
  image_id: string;
  quantity: number;
  product_id: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateOrderInput {
  lab_id: string;
  items: OrderItemInput[];
  client_info?: ClientInfo;
  note?: string;
}

export interface OrderItem {
  id: string;
  image_id: string | null;
  image_filename: string;
  quantity: number;
  product_name: string;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  gallery_id: string;
  lab: { id: string; name: string };
  status: string;
  total_price: number;
  currency: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  ordered_by_user_id: string | null;
  note: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export async function createSharedOrder(token: string, data: CreateOrderInput): Promise<Order> {
  const res = await sharedClient.post<Order>(`/${token}/orders`, data);
  return res.data;
}

export async function createOrder(galleryId: string, data: CreateOrderInput): Promise<Order> {
  const res = await client.post<Order>(`/galleries/${galleryId}/orders`, data);
  return res.data;
}

export async function getGalleryOrders(galleryId: string): Promise<Order[]> {
  const res = await client.get<Order[]>(`/galleries/${galleryId}/orders`);
  return res.data;
}

export async function getAllOrders(): Promise<Order[]> {
  const res = await client.get<Order[]>('/orders');
  return res.data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await client.patch<Order>(`/orders/${orderId}/status`, { status });
  return res.data;
}
