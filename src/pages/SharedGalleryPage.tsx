import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Camera, FileSpreadsheet, Archive, FileDown, X, Square, CheckSquare, ChevronLeft, Globe, Sun, Moon,
  ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Maximize, MessageCircle, Send,
} from 'lucide-react';
import {
  getSharedGallery,
  getSharedImages,
  updateSharedCopies,
  batchUpdateSharedCopies,
  getSharedThumbnailUrl,
  getSharedImageUrl,
  downloadSharedSingleImage,
  getComments,
  addComment,
  type CommentData,
  downloadSharedImagesZip,
} from '@/api/shared-access';
import type { ImageData } from '@/api/images';
import { useViewerStore } from '@/stores/viewer-store';
import { VirtualImageGrid } from '@/components/image/VirtualImageGrid';
import { formatDateTime } from '@/lib/format-date';
import { useTheme } from '@/hooks/use-theme';

function SharedThumbnail({
  image, token, editable, selected, onClick, onSelect, onCopiesChange,
}: {
  image: ImageData;
  token: string;
  editable: boolean;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onSelect: (e: React.MouseEvent) => void;
  onCopiesChange?: (imageId: string, copies: number) => void;
}) {
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

  return (
    <div className={`group relative rounded-lg border bg-card p-1.5 transition-colors ${
      selected ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50 dark:bg-blue-950/30' : 'border-border hover:border-foreground/20'
    }`}>
      <div
        className="relative aspect-square cursor-pointer overflow-hidden rounded-md bg-muted"
        onClick={(e) => onClick(e)}
      >
        <img
          src={getSharedThumbnailUrl(token, image.id)}
          alt={image.filename}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border border-white/70 bg-black/30"
          onClick={(e) => { e.stopPropagation(); onSelect(e); }}
        >
          {selected && <div className="h-3 w-3 rounded-sm bg-blue-500" />}
        </div>
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="truncate text-xs text-muted-foreground">{image.filename}</p>
        {editable && (
          <div className="mt-1 flex items-center gap-1.5">
            <label className="text-xs font-medium text-primary">{t('image.copies')}:</label>
            <input
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={(e) => setDisplayValue(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={commitValue}
              onFocus={(e) => e.target.select()}
              className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs outline-none ring-ring focus:ring-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SharedViewer({ images, token, editable, onCopiesChanged }: {
  images: ImageData[];
  token: string;
  editable: boolean;
  onCopiesChanged: () => void;
}) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentName, setCommentName] = useState(() => localStorage.getItem('comment_name') || '');
  const [commentText, setCommentText] = useState('');
  const {
    currentIndex, rotation, isFullscreen,
    closeViewer, toggleFullscreen, next, previous,
    rotateLeft, rotateRight, resetRotation,
  } = useViewerStore();
  const image = images[currentIndex];
  const [displayValue, setDisplayValue] = useState(String(image?.num_copies ?? 0));
  const copiesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image) setDisplayValue(String(image.num_copies));
  }, [image]);

  const getParsedCopies = () => {
    const parsed = parseInt(displayValue);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed));
  };

  const saveCopies = useCallback(() => {
    const copies = getParsedCopies();
    setDisplayValue(String(copies));
    if (!image || copies === image.num_copies || !editable) return;
    updateSharedCopies(token, image.id, copies).then(onCopiesChanged);
  }, [displayValue, image, editable, token, onCopiesChanged]);

  const handleNext = useCallback(() => {
    saveCopies();
    next(images.length);
  }, [saveCopies, next, images.length]);

  const handlePrevious = useCallback(() => {
    saveCopies();
    previous();
  }, [saveCopies, previous]);

  // Keyboard shortcuts
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement).tagName === 'INPUT';
      if (e.key === 'Escape') { if (isFullscreen) toggleFullscreen(); else { saveCopies(); closeViewer(); } return; }
      if (e.key === 'f' || e.key === 'F') { if (!inInput) toggleFullscreen(); return; }
      if (e.key === 'Enter' && !inInput) { saveCopies(); if (currentIndex < images.length - 1) next(images.length); return; }
      if (e.key === 'ArrowLeft' && (e.ctrlKey || !inInput)) { e.preventDefault(); handlePrevious(); return; }
      if (e.key === 'ArrowRight' && (e.ctrlKey || !inInput)) { e.preventDefault(); handleNext(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!image) return null;

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-black'
    : 'fixed inset-0 z-40 flex flex-col bg-background';
  const barClass = isFullscreen ? 'bg-black/80 text-white' : 'border-border bg-card';

  return (
    <div className={containerClass}>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-2 ${isFullscreen ? '' : 'border-b'} ${barClass}`}>
        <button onClick={() => { saveCopies(); closeViewer(); }} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50">
          <ChevronLeft className="h-4 w-4" />
          {t('image.backToGrid')}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{currentIndex + 1} / {images.length}</span>
          <button onClick={toggleFullscreen} className="rounded-md p-1.5 hover:bg-accent/50" title={t('image.fullscreen')}>
            <Maximize className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              setShowComments(!showComments);
              if (!showComments) {
                const c = await getComments(token, image.id);
                setComments(c);
              }
            }}
            className={`rounded-md p-1.5 hover:bg-accent/50 ${showComments ? 'text-primary' : ''}`}
            title="Comments"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => downloadSharedSingleImage(token, image.id)}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <FileDown className="inline h-3.5 w-3.5 mr-1" />
            {t('export.downloadImage')}
          </button>
        </div>
      </div>

      {/* Image with zoom/pan */}
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
                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img
                  src={getSharedImageUrl(token, image.id, 'medium')}
                  alt={image.filename}
                  style={{ transform: `rotate(${rotation}deg)`, maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  draggable={false}
                />
              </TransformComponent>

              {/* Zoom/rotate controls */}
              <div className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg px-2 py-1.5 shadow-lg ${isFullscreen ? 'bg-black/70 text-white' : 'bg-card border border-border'}`}>
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

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg ${isFullscreen ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-card border border-border hover:bg-accent'}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg ${isFullscreen ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-card border border-border hover:bg-accent'}`}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Comments panel */}
      {showComments && !isFullscreen && (
        <div className="border-t border-border bg-card">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-md bg-muted px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">{c.text}</p>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentName.trim() || !commentText.trim()) return;
                localStorage.setItem('comment_name', commentName.trim());
                const c = await addComment(token, image.id, commentName.trim(), commentText.trim());
                setComments((prev) => [...prev, c]);
                setCommentText('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder={t('auth.fullName')}
                className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-1"
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Comment..."
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-1"
              />
              <button
                type="submit"
                disabled={!commentName.trim() || !commentText.trim()}
                className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom bar — copies */}
      <div className={`flex items-center justify-center gap-4 px-4 py-3 ${isFullscreen ? '' : 'border-t'} ${barClass}`}>
        <span className="text-sm">{image.filename}</span>
        {editable && (
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
        <span className="text-xs text-muted-foreground">
          {editable && <>Enter: {t('common.save')} & {t('common.next')} | </>}Esc: {t('image.backToGrid')} | F: {t('image.fullscreen')}
        </span>
      </div>
    </div>
  );
}

export function SharedGalleryPage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isViewerOpen, openViewer } = useViewerStore();
  useTheme();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [batchCopies, setBatchCopies] = useState('0');
  const lastSelectedRef = useRef<number | null>(null);

  const { data: info, isLoading: infoLoading, error } = useQuery({
    queryKey: ['shared-gallery', token],
    queryFn: () => getSharedGallery(token!),
    enabled: !!token,
  });

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['shared-images', token],
    queryFn: () => getSharedImages(token!),
    enabled: !!token,
  });

  const images = imagesData?.images ?? [];
  const editable = info?.permission === 'edit';

  const copiesMutation = useMutation({
    mutationFn: ({ imageId, copies }: { imageId: string; copies: number }) =>
      updateSharedCopies(token!, imageId, copies),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-images', token] }),
  });

  const batchMutation = useMutation({
    mutationFn: ({ imageIds, copies }: { imageIds: string[]; copies: number }) =>
      batchUpdateSharedCopies(token!, imageIds, copies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-images', token] });
      setSelectedIds(new Set());
    },
  });

  const handleCopiesChange = useCallback(
    (imageId: string, copies: number) => {
      if (editable) copiesMutation.mutate({ imageId, copies });
    },
    [copiesMutation, editable]
  );

  const handleBatchApply = () => {
    if (selectedIds.size === 0) return;
    const parsed = parseInt(batchCopies);
    const value = isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed));
    setBatchCopies(String(value));
    batchMutation.mutate({ imageIds: Array.from(selectedIds), copies: value });
  };

  const handleSelect = useCallback((imageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isShift = e.shiftKey;
    const index = images.findIndex((img) => img.id === imageId);
    const anchor = lastSelectedRef.current;

    if (isShift) {
      const start = Math.min(anchor ?? 0, index);
      const end = Math.max(anchor ?? 0, index);
      const rangeIds = images.slice(start, end + 1).map((img) => img.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(imageId)) next.delete(imageId);
        else next.add(imageId);
        return next;
      });
    }

    lastSelectedRef.current = index;
  }, [images]);

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(images.map((i) => i.id)));
  };

  const handleDownloadZip = async (ids?: string[]) => {
    setDownloading(true);
    setDownloadProgress(t('common.loading'));
    try { await downloadSharedImagesZip(token!, ids); }
    finally { setDownloading(false); setDownloadProgress(''); }
  };

  const handleDownloadIndividual = async (ids: string[]) => {
    setDownloading(true);
    for (let i = 0; i < ids.length; i++) {
      setDownloadProgress(`${i + 1} / ${ids.length}`);
      await downloadSharedSingleImage(token!, ids[i]);
    }
    setDownloading(false);
    setDownloadProgress('');
  };

  const invalidateImages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shared-images', token] });
  }, [queryClient, token]);

  const selectedCount = selectedIds.size;

  if (infoLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-lg text-destructive">Link not found or expired</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {info?.branding_logo_url ? (
              <img src={info.branding_logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
            ) : (
              <Camera className="h-5 w-5 shrink-0 text-foreground" />
            )}
            <div className="min-w-0">
              {info?.branding_name && (
                <span className="mr-2 text-xs text-muted-foreground">{info.branding_name}</span>
              )}
              <span className="truncate font-semibold text-foreground">{info?.gallery_name}</span>
            </div>
            <span className="hidden shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {editable ? t('share.viewAndEdit') : t('share.viewOnly')}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                const newLang = i18n.language === 'sr' ? 'en' : 'sr';
                i18n.changeLanguage(newLang);
                localStorage.setItem('language', newLang);
              }}
              className="rounded-md p-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              title={i18n.language === 'sr' ? 'English' : 'Srpski'}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                document.documentElement.classList.toggle('dark', next === 'dark');
                localStorage.setItem('theme', next);
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {document.documentElement.classList.contains('dark') ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {editable && (
              <a
                href={`/api/shared/${token}/export/csv`}
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent"
                title={t('export.exportPrintOrder')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">{t('export.exportPrintOrder')}</span>
              </a>
            )}
            <button
              onClick={() => handleDownloadZip()}
              disabled={downloading || images.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
              title={t('export.downloadImages')}
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">{t('export.downloadImages')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
        {info?.gallery_description && (
          <p className="mb-4 text-sm text-muted-foreground">{info.gallery_description}</p>
        )}

        {imagesLoading ? (
          <p className="text-center text-muted-foreground">{t('common.loading')}</p>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No images in this gallery</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{images.length} {t('gallery.images')}</p>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                {selectedCount === images.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {selectedCount === images.length ? t('image.deselectAll') : t('image.selectAll')}
              </button>
            </div>
            <VirtualImageGrid
              itemCount={images.length}
              renderItem={(index) => {
                const image = images[index];
                return (
                  <SharedThumbnail
                    key={image.id}
                    image={image}
                    token={token!}
                    editable={editable}
                    selected={selectedIds.has(image.id)}
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        handleSelect(image.id, e);
                      } else {
                        openViewer(index);
                      }
                    }}
                    onSelect={(e) => handleSelect(image.id, e)}
                    onCopiesChange={handleCopiesChange}
                  />
                );
              }}
            />
          </>
        )}
      </main>

      {/* Selection action bar */}
      {selectedCount > 0 && !isViewerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card shadow-lg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-2 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setSelectedIds(new Set())} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {selectedCount} {t('export.downloadSelected')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {editable && (
                <>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={batchCopies}
                      onChange={(e) => setBatchCopies(e.target.value.replace(/[^0-9]/g, ''))}
                      onFocus={(e) => e.target.select()}
                      className="w-14 rounded border border-input bg-background px-1.5 py-1 text-xs outline-none ring-ring focus:ring-1"
                    />
                    <button
                      onClick={handleBatchApply}
                      disabled={batchMutation.isPending}
                      className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 sm:px-3 sm:py-1.5"
                      title={t('image.setCopiesToSelected')}
                    >
                      <span className="hidden sm:inline">{t('image.setCopiesToSelected')}</span>
                      <span className="sm:hidden">{t('image.copies')}</span>
                    </button>
                  </div>
                  <div className="hidden h-6 w-px bg-border sm:block" />
                </>
              )}
              <button
                onClick={() => handleDownloadZip(Array.from(selectedIds))}
                disabled={downloading}
                className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:py-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                {downloading ? downloadProgress : `ZIP (${selectedCount})`}
              </button>
              <button
                onClick={() => handleDownloadIndividual(Array.from(selectedIds))}
                disabled={downloading}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:py-1.5"
                title={t('export.downloadIndividual')}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{downloading ? downloadProgress : `${t('export.downloadIndividual')} (${selectedCount})`}</span>
                <span className="sm:hidden">{downloading ? downloadProgress : `(${selectedCount})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewerOpen && images.length > 0 && (
        <SharedViewer
          images={images}
          token={token!}
          editable={editable}
          onCopiesChanged={invalidateImages}
        />
      )}
    </div>
  );
}
