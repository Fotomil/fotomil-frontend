import { useCallback, useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { uploadImages, type ImageData } from '@/api/images';
import { toast } from 'sonner';

interface Props {
  galleryId: string;
  onUploaded: (images: ImageData[]) => void;
}

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
};

interface FileProgress {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'skipped' | 'error';
  percent: number;
}

export function ImageUploader({ galleryId, onUploaded }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError('');
      setSkipped([]);

      const tooLarge = fileRejections
        .filter((r) => r.errors.some((e) => e.code === 'file-too-large'))
        .map((r) => r.file.name);
      setRejected(tooLarge);

      if (acceptedFiles.length === 0) return;

      // Initialize per-file progress
      const initial: FileProgress[] = acceptedFiles.map((f) => ({
        name: f.name,
        status: 'pending',
        percent: 0,
      }));
      setFileProgress(initial);
      setUploading(true);

      const allUploaded: ImageData[] = [];
      const allSkipped: string[] = [];

      // Upload in batches of 3 for speed but with individual tracking
      const BATCH_SIZE = 3;
      for (let i = 0; i < acceptedFiles.length; i += BATCH_SIZE) {
        const batch = acceptedFiles.slice(i, i + BATCH_SIZE);

        // Mark batch as uploading
        setFileProgress((prev) =>
          prev.map((fp, idx) =>
            idx >= i && idx < i + BATCH_SIZE ? { ...fp, status: 'uploading', percent: 50 } : fp
          )
        );

        try {
          const result = await uploadImages(galleryId, batch);
          allUploaded.push(...result.uploaded);
          allSkipped.push(...result.skipped);

          // Mark batch as done/skipped
          setFileProgress((prev) =>
            prev.map((fp, idx) => {
              if (idx >= i && idx < i + BATCH_SIZE) {
                const isSkipped = result.skipped.includes(fp.name);
                return { ...fp, status: isSkipped ? 'skipped' : 'done', percent: 100 };
              }
              return fp;
            })
          );
        } catch {
          setFileProgress((prev) =>
            prev.map((fp, idx) =>
              idx >= i && idx < i + BATCH_SIZE ? { ...fp, status: 'error', percent: 0 } : fp
            )
          );
        }
      }

      setSkipped(allSkipped);
      onUploaded(allUploaded);
      if (allUploaded.length > 0) {
        toast.success(`${allUploaded.length} ${t('gallery.images')} uploaded`);
      }
      setUploading(false);
      // Keep progress visible for 2 seconds then clear
      setTimeout(() => setFileProgress([]), 2000);
    },
    [galleryId, onUploaded, t]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    disabled: uploading,
    maxSize: MAX_SIZE_BYTES,
  });

  // Auto-open file picker on mobile
  useEffect(() => {
    if (window.innerWidth < 640) {
      open();
    }
  }, []);

  const overallPercent = fileProgress.length > 0
    ? Math.round(fileProgress.reduce((sum, f) => sum + f.percent, 0) / fileProgress.length)
    : 0;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`hidden sm:flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-foreground/30'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? `${t('gallery.uploading')} ${overallPercent}%` : t('gallery.dragDrop')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          JPG, PNG, GIF, BMP, TIFF, WebP · max {MAX_SIZE_MB}MB
        </p>
      </div>
      {/* Hidden input for mobile — file picker opened via open() */}
      <div className="sm:hidden">
        <input {...getInputProps()} />
      </div>

      {/* Per-file progress */}
      {fileProgress.length > 0 && (
        <div className="space-y-1">
          {fileProgress.map((fp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-muted-foreground">{fp.name}</span>
                  {fp.status === 'done' && <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />}
                  {fp.status === 'error' && <X className="h-3 w-3 shrink-0 text-destructive" />}
                  {fp.status === 'skipped' && <AlertTriangle className="h-3 w-3 shrink-0 text-yellow-500" />}
                </div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      fp.status === 'error' ? 'bg-destructive' :
                      fp.status === 'skipped' ? 'bg-yellow-500' :
                      fp.status === 'done' ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${fp.percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t('gallery.fileTooLarge', { max: MAX_SIZE_MB })}: {rejected.join(', ')}
          </span>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t('gallery.skippedDuplicate')}: {skipped.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
