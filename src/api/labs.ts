import axios from 'axios';

const labsClient = axios.create({ baseURL: '/api' });

export interface LabProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  sort_order: number;
  is_active: boolean;
}

export interface Lab {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  is_active: boolean;
  products: LabProduct[];
}

export async function getLabs(): Promise<Lab[]> {
  const res = await labsClient.get<Lab[]>('/labs');
  return res.data;
}
