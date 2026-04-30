import axios from 'axios';
import client from './client';

const publicClient = axios.create({ baseURL: '/api' });

export interface LabApplicationInput {
  lab_name: string;
  lab_email: string;
  lab_address?: string;
  lab_phone?: string;
  lab_website?: string;
  message?: string;
}

export interface LabApplication {
  id: string;
  lab_name: string;
  lab_email: string;
  lab_address: string | null;
  lab_phone: string | null;
  lab_website: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  approved_lab_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function applyForLabPartnership(data: LabApplicationInput): Promise<void> {
  await publicClient.post('/labs/apply', data);
}

export async function listLabApplications(status?: string): Promise<LabApplication[]> {
  const params = status ? { status } : {};
  const res = await client.get<LabApplication[]>('/admin/lab-applications', { params });
  return res.data;
}

export async function approveLabApplication(id: string): Promise<LabApplication> {
  const res = await client.post<LabApplication>(`/admin/lab-applications/${id}/approve`);
  return res.data;
}

export async function rejectLabApplication(id: string, reason: string | null): Promise<LabApplication> {
  const res = await client.post<LabApplication>(`/admin/lab-applications/${id}/reject`, { reason });
  return res.data;
}
