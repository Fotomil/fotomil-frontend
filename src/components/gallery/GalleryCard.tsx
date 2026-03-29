import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Images, Trash2, Pencil } from 'lucide-react';
import type { Gallery } from '@/api/galleries';
import { getThumbnailUrl } from '@/api/images';

interface Props {
  gallery: Gallery;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function GalleryCard({ gallery, onDelete, onEdit }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const hasCover = gallery.cover_image_id && !imgError;

  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:shadow-sm"
      onClick={() => navigate(`/gallery/${gallery.id}`)}
    >
      <div className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
        {hasCover ? (
          <img
            src={getThumbnailUrl(gallery.cover_image_id!)}
            alt={gallery.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Images className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{gallery.name}</h3>
          {gallery.description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{gallery.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {gallery.image_count} {t('gallery.images')}
          </p>
        </div>

        <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(gallery.id);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(gallery.id);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
