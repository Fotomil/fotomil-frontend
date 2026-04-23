import axios from 'axios';
import type { ImageData } from './images';

// Shared access uses plain axios (no auth headers needed)
const sharedClient = axios.create({ baseURL: '/api/shared' });

export interface SharedGalleryInfo {
  gallery_name: string;
  gallery_description: string | null;
  permission: 'view' | 'edit';
  image_count: number;
  branding_name: string | null;
  branding_logo_url: string | null;
  bio: string | null;
}

export async function getSharedGallery(token: string): Promise<SharedGalleryInfo> {
  const res = await sharedClient.get<SharedGalleryInfo>(`/${token}/gallery`);
  return res.data;
}

export async function getSharedImages(
  token: string,
  sortBy: string = 'sort_order',
  sortDir: string = 'asc'
): Promise<{ images: ImageData[]; total: number }> {
  const res = await sharedClient.get(`/${token}/images`, {
    params: { sort_by: sortBy, sort_dir: sortDir },
  });
  return res.data;
}

export async function updateSharedCopies(
  token: string,
  imageId: string,
  numCopies: number
): Promise<ImageData> {
  const res = await sharedClient.patch<ImageData>(`/${token}/images/${imageId}`, {
    num_copies: numCopies,
  });
  return res.data;
}

export function getSharedThumbnailUrl(token: string, imageId: string): string {
  return `/api/shared/${token}/images/${imageId}/thumbnail`;
}

export function getSharedImageUrl(
  token: string,
  imageId: string,
  size: 'original' | 'medium' | 'thumbnail' = 'medium'
): string {
  return `/api/shared/${token}/images/${imageId}/file?size=${size}`;
}

export async function batchUpdateSharedCopies(
  token: string,
  imageIds: string[],
  numCopies: number
): Promise<{ updated: number }> {
  const res = await sharedClient.patch(`/${token}/images/batch`, {
    image_ids: imageIds,
    num_copies: numCopies,
  });
  return res.data;
}

export function getSharedDownloadUrl(token: string, imageId: string): string {
  return `/api/shared/${token}/images/${imageId}/download`;
}

export function downloadSharedSingleImage(token: string, imageId: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = getSharedDownloadUrl(token, imageId);
    document.body.appendChild(iframe);
    setTimeout(() => {
      iframe.remove();
      resolve();
    }, 1000);
  });
}

export async function downloadSharedImagesZip(token: string, imageIds?: string[]): Promise<void> {
  const res = await sharedClient.post(
    `/${token}/download/zip`,
    { image_ids: imageIds || null },
    { responseType: 'blob' }
  );
  const blob = new Blob([res.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = res.headers['content-disposition']?.match(/filename="(.+?)"/)?.[1] || 'images.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export interface CommentData {
  id: string;
  image_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export async function getComments(token: string, imageId: string): Promise<CommentData[]> {
  const res = await sharedClient.get<CommentData[]>(`/${token}/images/${imageId}/comments`);
  return res.data;
}

export async function addComment(
  token: string,
  imageId: string,
  authorName: string,
  text: string
): Promise<CommentData> {
  const res = await sharedClient.post<CommentData>(`/${token}/images/${imageId}/comments`, {
    author_name: authorName,
    text,
  });
  return res.data;
}
