import client from './client';

export interface ImageData {
  id: string;
  gallery_id: string;
  filename: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  exif_data: Record<string, unknown> | null;
  sort_order: number;
  num_copies: number;
  created_at: string;
  updated_at: string;
}

export async function getImages(
  galleryId: string,
  sortBy: string = 'sort_order',
  sortDir: string = 'asc'
): Promise<{ images: ImageData[]; total: number }> {
  const res = await client.get(`/galleries/${galleryId}/images`, {
    params: { sort_by: sortBy, sort_dir: sortDir },
  });
  return res.data;
}

export interface UploadResult {
  uploaded: ImageData[];
  skipped: string[];
}

export async function uploadImages(
  galleryId: string,
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await client.post<UploadResult>(`/galleries/${galleryId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data;
}

export async function updateCopies(imageId: string, numCopies: number): Promise<ImageData> {
  const res = await client.patch<ImageData>(`/images/${imageId}`, { num_copies: numCopies });
  return res.data;
}

export async function batchUpdateCopies(
  galleryId: string,
  imageIds: string[],
  numCopies: number
): Promise<{ updated: number }> {
  const res = await client.patch(`/galleries/${galleryId}/images/batch`, {
    image_ids: imageIds,
    num_copies: numCopies,
  });
  return res.data;
}

export async function reorderImages(galleryId: string, imageIds: string[]): Promise<void> {
  await client.post(`/galleries/${galleryId}/reorder`, { image_ids: imageIds });
}

export async function deleteImage(imageId: string): Promise<void> {
  await client.delete(`/images/${imageId}`);
}

function getToken(): string {
  return localStorage.getItem('access_token') || '';
}

export function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail?token=${getToken()}`;
}

export function getImageUrl(imageId: string, size: 'original' | 'medium' | 'thumbnail' = 'medium'): string {
  return `/api/images/${imageId}/file?size=${size}&token=${getToken()}`;
}

export function getSingleDownloadUrl(imageId: string): string {
  return `/api/images/${imageId}/download?token=${getToken()}`;
}

export async function downloadImagesZip(galleryId: string, imageIds?: string[]): Promise<void> {
  const res = await client.post(
    `/galleries/${galleryId}/download/zip`,
    { image_ids: imageIds || null },
    { responseType: 'blob' }
  );
  const blob = new Blob([res.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = res.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'images.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadSingleImage(imageId: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = getSingleDownloadUrl(imageId);
    document.body.appendChild(iframe);
    // Clean up after download starts
    setTimeout(() => {
      iframe.remove();
      resolve();
    }, 1000);
  });
}
