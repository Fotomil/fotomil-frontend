import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { getThumbnailUrl, type ImageData } from '@/api/images';
import { useLongPress } from '@/hooks/use-long-press';

interface Props {
  image: ImageData;
  selected?: boolean;
  editable?: boolean;
  showCopies?: boolean;
  thumbnailUrl?: string;
  onClick?: (e: React.MouseEvent) => void;
  onSelect?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onLongPress?: () => void;
  onCopiesChange?: (imageId: string, copies: number) => void;
  commentCount?: number;
  onShowComments?: (imageId: string) => void;
}

export function ImageThumbnail({ image, selected, editable = true, showCopies = true, thumbnailUrl, onClick, onSelect, onContextMenu, onLongPress, onCopiesChange, commentCount, onShowComments }: Props) {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState(String(image.num_copies));

  useEffect(() => {
    setDisplayValue(String(image.num_copies));
  }, [image.num_copies]);

  const commitValue = () => {
    const parsed = parseInt(displayValue);
    const value = isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed));
    setDisplayValue(String(value));
    if (value !== image.num_copies) {
      onCopiesChange?.(image.id, value);
    }
  };

  const handleLongPress = useCallback(() => {
    onLongPress?.();
  }, [onLongPress]);

  const longPress = useLongPress({ onLongPress: handleLongPress, delay: 500 });

  return (
    <div
      data-selected={selected || undefined}
      onContextMenu={onContextMenu}
      className={`group relative rounded-lg border p-1.5 transition-colors ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-border bg-card hover:border-foreground/20'
      }`}
    >
      <div
        className="relative aspect-square cursor-pointer overflow-hidden rounded-md bg-muted"
        onClick={(e) => {
          // If long press just happened, don't open viewer
          if (longPress.didLongPress.current) {
            longPress.didLongPress.current = false;
            return;
          }
          onClick?.(e);
        }}
        onTouchStart={longPress.onTouchStart}
        onTouchEnd={longPress.onTouchEnd}
        onTouchMove={longPress.onTouchMove}
      >
        <img
          src={thumbnailUrl || getThumbnailUrl(image.id)}
          alt={image.filename}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        {onSelect && (
          <div
            className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border border-white/70 bg-black/30"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(e);
            }}
          >
            {selected && <div className="h-3 w-3 rounded-sm bg-blue-500" />}
          </div>
        )}
        {/* Comment count badge */}
        {commentCount != null && commentCount > 0 && (
          <div
            className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              onShowComments?.(image.id);
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
        )}
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="truncate text-xs text-muted-foreground" title={image.filename}>
          {image.filename}
        </p>
        {showCopies && (
          <div className="mt-1 flex items-center gap-1.5">
            <label className="text-xs font-medium text-primary">{t('image.copies')}:</label>
            {editable ? (
              <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => setDisplayValue(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitValue}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.stopPropagation()}
                className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground outline-none ring-ring focus:ring-1"
              />
            ) : (
              <span className="text-xs text-foreground">{image.num_copies}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
