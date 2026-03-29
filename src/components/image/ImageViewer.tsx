import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize,
  RefreshCw,
  Info,
  X,
  Minimize,
  MessageCircle,
} from 'lucide-react';
import { useViewerStore } from '@/stores/viewer-store';
import { formatDateTime } from '@/lib/format-date';
import { getImageUrl, updateCopies, type ImageData } from '@/api/images';
import client from '@/api/client';

interface Comment {
  id: string;
  image_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

interface Props {
  images: ImageData[];
  onCopiesChanged: () => void;
  galleryId?: string;
  initialShowComments?: boolean;
  imageUrlFn?: (imageId: string, size: string) => string;
  saveCopiesFn?: (imageId: string, copies: number) => Promise<void>;
  showCopies?: boolean;
  commentsLoadFn?: (imageId: string) => Promise<Comment[]>;
}

export function ImageViewer({ images, onCopiesChanged, galleryId, initialShowComments, imageUrlFn, saveCopiesFn, showCopies = true, commentsLoadFn }: Props) {
  const { t } = useTranslation();
  const {
    currentIndex,
    rotation,
    isFullscreen,
    rotateLeft,
    rotateRight,
    resetRotation,
    toggleFullscreen,
    closeViewer,
    next,
    previous,
  } = useViewerStore();

  const image = images[currentIndex];
  const [displayValue, setDisplayValue] = useState(String(image?.num_copies ?? 0));
  const [showExif, setShowExif] = useState(false);
  const [showComments, setShowComments] = useState(initialShowComments ?? false);
  const [comments, setComments] = useState<Comment[]>([]);
  const copiesRef = useRef<HTMLInputElement>(null);

  // Sync when image changes
  useEffect(() => {
    if (image) setDisplayValue(String(image.num_copies));
  }, [image]);

  // Load comments when panel is open and image changes
  useEffect(() => {
    if (showComments && image) {
      if (commentsLoadFn) {
        commentsLoadFn(image.id).then(setComments).catch(() => {});
      } else if (galleryId) {
        client.get(`/galleries/${galleryId}/comments`).then((res) => {
          const all: Comment[] = res.data;
          setComments(all.filter((c) => c.image_id === image.id));
        }).catch(() => {});
      }
    }
  }, [showComments, currentIndex, galleryId, image, commentsLoadFn]);

  // Auto-focus copies input (desktop only — avoid keyboard popup on mobile)
  useEffect(() => {
    if (window.innerWidth >= 640) {
      copiesRef.current?.select();
    }
  }, [currentIndex]);

  const getParsedCopies = () => {
    const parsed = parseInt(displayValue);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed));
  };

  const saveCopies = useCallback(async () => {
    const copies = getParsedCopies();
    setDisplayValue(String(copies));
    if (!image || copies === image.num_copies) return;
    if (saveCopiesFn) {
      await saveCopiesFn(image.id, copies);
    } else {
      await updateCopies(image.id, copies);
    }
    onCopiesChanged();
  }, [image, displayValue, onCopiesChanged]);

  const handleNext = useCallback(() => {
    saveCopies();
    next(images.length);
  }, [saveCopies, next, images.length]);

  const handlePrevious = useCallback(() => {
    saveCopies();
    previous();
  }, [saveCopies, previous]);

  const handleEnter = useCallback(() => {
    saveCopies();
    if (currentIndex < images.length - 1) {
      next(images.length);
    }
  }, [saveCopies, currentIndex, images.length, next]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT';

      if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen();
        else closeViewer();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!inInput) toggleFullscreen();
        return;
      }
      if (e.key === 'Enter') {
        handleEnter();
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (e.ctrlKey || !inInput) {
          e.preventDefault();
          handlePrevious();
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        if (e.ctrlKey || !inInput) {
          e.preventDefault();
          handleNext();
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen, toggleFullscreen, closeViewer, handleNext, handlePrevious, handleEnter]);

  if (!image) return null;

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-black'
    : 'fixed inset-0 z-40 flex flex-col bg-background';

  return (
    <div className={containerClass}>
      {/* Top bar */}
      {isFullscreen ? (
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={toggleFullscreen}
            className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            title="Esc"
          >
            <Minimize className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { saveCopies(); closeViewer(); }}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('image.backToGrid')}
            </button>
            <span className="max-w-[30vw] truncate text-sm text-muted-foreground sm:max-w-none">{image.filename}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2 text-sm text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
            {galleryId && (
              <button
                onClick={() => setShowComments(!showComments)}
                className={`rounded-md p-1.5 hover:bg-accent/50 ${showComments ? 'text-primary' : ''}`}
                title={t('gallery.comments')}
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setShowExif(!showExif)} className="rounded-md p-1.5 hover:bg-accent/50" title={t('image.exifInfo')}>
              <Info className="h-4 w-4" />
            </button>
            <button onClick={toggleFullscreen} className="rounded-md p-1.5 hover:bg-accent/50" title={t('image.fullscreen')}>
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image area */}
      <div className="relative flex-1 overflow-hidden">
        <TransformWrapper
          key={`${image.id}-${rotation}`}
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={imageUrlFn ? imageUrlFn(image.id, 'medium') : getImageUrl(image.id, 'medium')}
                  alt={image.filename}
                  style={{ transform: `rotate(${rotation}deg)`, maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  draggable={false}
                />
              </TransformComponent>

              {/* Zoom/rotate controls — hidden in fullscreen */}
              <div className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg px-2 py-1.5 shadow-lg ${isFullscreen ? 'hidden' : 'bg-card border border-border'}`}>
                <button onClick={() => zoomIn()} className="rounded p-1.5 hover:bg-accent/50" title={t('image.zoomIn')}>
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button onClick={() => zoomOut()} className="rounded p-1.5 hover:bg-accent/50" title={t('image.zoomOut')}>
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button onClick={() => resetTransform()} className="rounded p-1.5 hover:bg-accent/50" title={t('image.resetZoom')}>
                  <RefreshCw className="h-4 w-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-border" />
                <button onClick={rotateLeft} className="rounded p-1.5 hover:bg-accent/50" title={t('image.rotateLeft')}>
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={rotateRight} className="rounded p-1.5 hover:bg-accent/50" title={t('image.rotateRight')}>
                  <RotateCw className="h-4 w-4" />
                </button>
                <button onClick={resetRotation} className="rounded p-1.5 hover:bg-accent/50" title={t('image.resetRotation')}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </TransformWrapper>

        {/* Nav arrows — hidden in fullscreen */}
        {!isFullscreen && currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-lg hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {!isFullscreen && currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-lg hover:bg-accent"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {/* EXIF panel — hidden in fullscreen */}
        {!isFullscreen && showExif && image.exif_data && (
          <div className={`absolute right-0 top-0 h-full w-72 overflow-y-auto p-4 shadow-lg ${isFullscreen ? 'bg-black/80 text-white' : 'bg-card border-l border-border'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">{t('image.exifInfo')}</h3>
              <button onClick={() => setShowExif(false)} className="rounded p-1 hover:bg-accent/50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {image.width && image.height && (
                <div>
                  <dt className="text-muted-foreground">Resolution</dt>
                  <dd>{image.width} x {image.height}</dd>
                </div>
              )}
              {image.file_size && (
                <div>
                  <dt className="text-muted-foreground">File size</dt>
                  <dd>{(image.file_size / 1024 / 1024).toFixed(2)} MB</dd>
                </div>
              )}
              {Object.entries(image.exif_data).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="break-all">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Comments panel — hidden in fullscreen */}
        {!isFullscreen && showComments && (
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-card p-4 shadow-lg border-r border-border">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">{t('gallery.comments')}</h3>
              <button onClick={() => setShowComments(false)} className="rounded p-1 hover:bg-accent/50">
                <X className="h-4 w-4" />
              </button>
            </div>
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('gallery.noComments')}</p>
            ) : (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-md bg-muted px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{c.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar — hidden in fullscreen */}
      {!isFullscreen && (
      <div className="flex items-center justify-center gap-4 border-t border-border bg-card px-4 py-3">
        {showCopies && (
          <>
            <label className="text-sm font-medium">{t('image.numberOfCopies')}:</label>
            <input
              ref={copiesRef}
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={(e) => setDisplayValue(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => saveCopies()}
              onFocus={(e) => e.target.select()}
              className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-center text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
          </>
        )}
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Enter: {t('common.save')} & {t('common.next')} | Esc: {t('image.backToGrid')} | F: {t('image.fullscreen')}
        </span>
      </div>
      )}
    </div>
  );
}
