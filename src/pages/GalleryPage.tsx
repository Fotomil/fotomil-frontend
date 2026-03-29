import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, ArrowUpDown, Share2, FileSpreadsheet, BarChart3, Pencil,
  X, Archive, FileDown, CheckSquare, Square, Trash2, MousePointerClick,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ImageUploader } from '@/components/image/ImageUploader';
import { ImageThumbnail } from '@/components/image/ImageThumbnail';
import { ImageViewer } from '@/components/image/ImageViewer';
import { ShareDialog } from '@/components/gallery/ShareDialog';
import { ImageContextMenu } from '@/components/image/ImageContextMenu';
import { getGallery, updateGallery } from '@/api/galleries';
import client from '@/api/client';
import { getImages, updateCopies, batchUpdateCopies, downloadImagesZip, downloadSingleImage, deleteImage, reorderImages, type ImageData } from '@/api/images';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useViewerStore } from '@/stores/viewer-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatDateTime } from '@/lib/format-date';
import { ThumbnailSkeleton } from '@/components/ui/Skeleton';
import { VirtualImageGrid } from '@/components/image/VirtualImageGrid';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function GalleryPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEditGallery, setShowEditGallery] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<{ total_views: number; unique_visitors: number; recent_views: { ip_address: string; viewed_at: string }[] } | null>(null);
  const [commentsModal, setCommentsModal] = useState<{ imageId: string; filename: string } | null>(null);
  const [modalComments, setModalComments] = useState<{ id: string; author_name: string; text: string; created_at: string }[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const token = useAuthStore((s) => s.accessToken);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('sort_order');
  const [sortDir, setSortDir] = useState('asc');
  const [batchCopies, setBatchCopies] = useState('0');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; imageId: string } | null>(null);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem('hint_context_menu_dismissed'));

  // Drag-and-drop: require 10px movement before starting drag (to not interfere with clicks)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const lastSelectedRef = useRef<number | null>(null);

  const { isViewerOpen, openViewer } = useViewerStore();


  const { data: gallery } = useQuery({
    queryKey: ['gallery', id],
    queryFn: () => getGallery(id!),
    enabled: !!id,
  });

  // Auto-open edit modal when navigated with ?edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && gallery) {
      setShowEditGallery(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, gallery, setSearchParams]);

  // Fetch comment counts per image
  const { data: allComments = [] } = useQuery({
    queryKey: ['gallery-comments', id],
    queryFn: async () => {
      const res = await client.get(`/galleries/${id}/comments`);
      return res.data as { image_id: string }[];
    },
    enabled: !!id,
  });
  const commentCounts = allComments.reduce<Record<string, number>>((acc, c) => {
    acc[c.image_id] = (acc[c.image_id] || 0) + 1;
    return acc;
  }, {});

  const { data: imagesData, isLoading } = useQuery({
    queryKey: ['images', id, sortBy, sortDir],
    queryFn: () => getImages(id!, sortBy, sortDir),
    enabled: !!id,
  });

  const images = imagesData?.images ?? [];

  const copiesMutation = useMutation({
    mutationFn: ({ imageId, copies }: { imageId: string; copies: number }) =>
      updateCopies(imageId, copies),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['images', id] }),
  });

  const batchMutation = useMutation({
    mutationFn: ({ imageIds, copies }: { imageIds: string[]; copies: number }) =>
      batchUpdateCopies(id!, imageIds, copies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', id] });
      setSelectedIds(new Set());
    },
  });

  const handleCopiesChange = useCallback(
    (imageId: string, copies: number) => copiesMutation.mutate({ imageId, copies }),
    [copiesMutation]
  );

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    toast(`${t('common.delete')} ${count} ${t('gallery.images')}?`, {
      action: {
        label: t('common.delete'),
        onClick: async () => {
          for (const imageId of selectedIds) {
            await deleteImage(imageId);
          }
          setSelectedIds(new Set());
          queryClient.invalidateQueries({ queryKey: ['images', id] });
          queryClient.invalidateQueries({ queryKey: ['gallery', id] });
          queryClient.invalidateQueries({ queryKey: ['galleries'] });
          toast.success(`${count} ${t('gallery.images')} deleted`);
        },
      },
    });
  };

  const handleSetCover = useCallback(async (imageId: string) => {
    if (!id) return;
    await updateGallery(id, { cover_image_id: imageId });
    queryClient.invalidateQueries({ queryKey: ['gallery', id] });
    queryClient.invalidateQueries({ queryKey: ['galleries'] });
  }, [id, queryClient]);

  const handleUploaded = useCallback(
    (_images: ImageData[]) => {
      queryClient.invalidateQueries({ queryKey: ['images', id] });
      queryClient.invalidateQueries({ queryKey: ['gallery', id] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setShowUploader(false);
    },
    [queryClient, id]
  );

  // Selection: click toggles, shift-click selects range
  const handleSelect = useCallback((imageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isShift = e.shiftKey;
    const index = images.findIndex((img) => img.id === imageId);
    const anchor = lastSelectedRef.current;

    // Compute new selection synchronously, then set it
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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally for instant feedback
    const reordered = [...images];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Save to backend
    const newOrder = reordered.map((img) => img.id);
    await reorderImages(id, newOrder);
    queryClient.invalidateQueries({ queryKey: ['images', id] });
  }, [images, id, queryClient]);

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((i) => i.id)));
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  };

  const handleBatchApply = () => {
    if (selectedIds.size === 0) return;
    const parsed = parseInt(batchCopies);
    const value = isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed));
    setBatchCopies(String(value));
    batchMutation.mutate({ imageIds: Array.from(selectedIds), copies: value });
  };

  // Download selected as ZIP
  const handleDownloadZip = async (ids?: string[]) => {
    setDownloading(true);
    setDownloadProgress(t('common.loading'));
    try {
      await downloadImagesZip(id!, ids);
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // Download individually via hidden iframes with staggered delay
  const handleDownloadIndividual = async (ids: string[]) => {
    setDownloading(true);
    for (let i = 0; i < ids.length; i++) {
      setDownloadProgress(`${i + 1} / ${ids.length}`);
      await downloadSingleImage(ids[i]);
    }
    setDownloading(false);
    setDownloadProgress('');
  };

  const invalidateImages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['images', id] });
  }, [queryClient, id]);

  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/')}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{gallery?.name ?? '...'}</h1>
              {gallery?.description && (
                <p className="truncate text-sm text-muted-foreground">{gallery.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowEditGallery(true)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={`/api/galleries/${id}/export/csv?token=${token}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent sm:px-3 sm:py-2"
              title={t('export.exportPrintOrder')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">{t('export.exportPrintOrder')}</span>
            </a>
            <a
              href={`/api/galleries/${id}/export/pdf?token=${token}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent sm:px-3 sm:py-2"
              title={t('export.exportPDF')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">{t('export.exportPDF')}</span>
            </a>
            <a
              href={`/api/galleries/${id}/export/invoice?token=${token}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent sm:px-3 sm:py-2"
              title={t('export.exportInvoice')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">{t('export.exportInvoice')}</span>
            </a>
            <button
              onClick={async () => {
                try {
                  const res = await client.get(`/galleries/${id}/analytics`);
                  setAnalytics(res.data);
                  setShowAnalytics(true);
                } catch { /* ignore */ }
              }}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent sm:px-3 sm:py-2"
              title={t('gallery.analytics')}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('gallery.analytics')}</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-accent sm:px-3 sm:py-2"
              title={t('share.shareGallery')}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('share.shareGallery')}</span>
            </button>
            <button
              onClick={() => setShowUploader((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4 sm:py-2"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{t('gallery.uploadImages')}</span>
            </button>
          </div>
        </div>

        {/* Uploader */}
        {showUploader && (
          <div className="mb-6">
            <ImageUploader galleryId={id!} onUploaded={handleUploaded} />
          </div>
        )}

        {/* Image grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => <ThumbnailSkeleton key={i} />)}
          </div>
        ) : images.length === 0 ? (
          <ImageUploader galleryId={id!} onUploaded={handleUploaded} />
        ) : (
          <>
            {/* Toolbar: sort + select all */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {t('image.sortBy')}:
                {['sort_order', 'filename', 'num_copies', 'created_at'].map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`rounded px-2 py-0.5 text-xs ${sortBy === field ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    {field === 'sort_order' ? '#' : field === 'num_copies' ? t('image.copiesCount') : field === 'created_at' ? t('image.dateAdded') : t('image.filename')}
                    {sortBy === field && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {selectedCount === images.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  {selectedCount === images.length ? t('image.deselectAll') : t('image.selectAll')}
                </button>
                <span className="text-xs text-muted-foreground">
                  {images.length} {t('gallery.images')}
                </span>
              </div>
            </div>

            {showHint && images.length > 0 && (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/40">
                <MousePointerClick className="h-5 w-5 shrink-0 text-blue-500" />
                <p className="flex-1 text-sm text-blue-700 dark:text-blue-300">
                  {t('gallery.contextMenuHint')}
                </p>
                <button
                  onClick={() => {
                    setShowHint(false);
                    localStorage.setItem('hint_context_menu_dismissed', '1');
                  }}
                  className="shrink-0 rounded-md p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {(() => {
              const renderThumb = (index: number) => {
                const image = images[index];
                return (
                  <ImageThumbnail
                    key={image.id}
                    image={image}
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
                    commentCount={commentCounts[image.id] || 0}
                    onShowComments={async () => {
                      setCommentsModal({ imageId: image.id, filename: image.filename });
                      try {
                        const res = await client.get(`/galleries/${id}/comments`);
                        const all = res.data as { id: string; image_id: string; author_name: string; text: string; created_at: string }[];
                        setModalComments(all.filter((c) => c.image_id === image.id));
                      } catch { setModalComments([]); }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, imageId: image.id });
                      if (showHint) {
                        setShowHint(false);
                        localStorage.setItem('hint_context_menu_dismissed', '1');
                      }
                    }}
                    onLongPress={() => {
                      setContextMenu({ x: window.innerWidth / 2 - 96, y: window.innerHeight / 2 - 60, imageId: image.id });
                      if (showHint) {
                        setShowHint(false);
                        localStorage.setItem('hint_context_menu_dismissed', '1');
                      }
                    }}
                  />
                );
              };

              // Use virtual grid for large galleries, DnD grid for small ones
              if (images.length > 100) {
                return <VirtualImageGrid itemCount={images.length} renderItem={renderThumb} />;
              }

              return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                    <div className="grid select-none grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {images.map((_, index) => (
                        <SortableItem key={images[index].id} id={images[index].id}>
                          {renderThumb(index)}
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              );
            })()}
          </>
        )}
      </main>

      {/* Selection action bar — fixed bottom */}
      {selectedCount > 0 && !isViewerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card shadow-lg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-2 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {selectedCount} {t('export.downloadSelected')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Batch copies */}
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

              {/* Delete */}
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 sm:gap-1.5 sm:px-3 sm:py-1.5"
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.delete')}</span>
                <span>({selectedCount})</span>
              </button>

              <div className="hidden h-6 w-px bg-border sm:block" />

              {/* ZIP */}
              <button
                onClick={() => handleDownloadZip(Array.from(selectedIds))}
                disabled={downloading}
                className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:py-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                {downloading ? downloadProgress : `ZIP (${selectedCount})`}
              </button>

              {/* Individual */}
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

      {/* Image viewer overlay */}
      {isViewerOpen && images.length > 0 && (
        <ImageViewer
          images={images}
          onCopiesChanged={invalidateImages}
          galleryId={id}
        />
      )}

      {/* Share dialog */}
      <ShareDialog galleryId={id!} open={showShare} onClose={() => setShowShare(false)} />

      {/* Context menu */}
      {contextMenu && (
        <ImageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDownload={() => downloadSingleImage(contextMenu.imageId)}
          onDelete={() => {
            toast(t('gallery.deleteConfirm'), {
              action: {
                label: t('common.delete'),
                onClick: async () => {
                  await deleteImage(contextMenu.imageId);
                  queryClient.invalidateQueries({ queryKey: ['images', id] });
                  queryClient.invalidateQueries({ queryKey: ['gallery', id] });
                  toast.success(t('common.delete') + ' - OK');
                },
              },
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      {/* Analytics dialog */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAnalytics(false)}>
          <div className="mx-2 w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t('gallery.analytics')}</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 flex gap-4">
              <div className="flex-1 rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics.total_views}</p>
                <p className="text-xs text-muted-foreground">{t('gallery.totalViews')}</p>
              </div>
              <div className="flex-1 rounded-lg bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{analytics.unique_visitors}</p>
                <p className="text-xs text-muted-foreground">{t('gallery.uniqueVisitors')}</p>
              </div>
            </div>
            {analytics.recent_views.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground">{t('gallery.recentViews')}</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {analytics.recent_views.map((v, i) => (
                    <div key={i} className="flex items-center justify-between rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
                      <span>{v.ip_address || 'Unknown'}</span>
                      <span>{formatDateTime(v.viewed_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments modal */}
      {commentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCommentsModal(null)} onKeyDown={(e) => { if (e.key === 'Escape') setCommentsModal(null); }} tabIndex={-1} ref={(el) => el?.focus()}>
          <div className="mx-2 w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('gallery.comments')}</h2>
                <p className="text-xs text-muted-foreground">{commentsModal.filename}</p>
              </div>
              <button onClick={() => setCommentsModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalComments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('gallery.noComments')}</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {modalComments.map((c) => (
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
        </div>
      )}

      {/* Edit gallery modal */}
      {showEditGallery && gallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditGallery(false)} onKeyDown={(e) => { if (e.key === 'Escape') setShowEditGallery(false); }} tabIndex={-1} ref={(el) => el?.focus()}>
          <div className="mx-2 w-full max-w-lg rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t('common.edit')}</h2>
              <button onClick={() => setShowEditGallery(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
                const desc = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim();
                if (name && id) {
                  await updateGallery(id, { name, description: desc });
                  queryClient.invalidateQueries({ queryKey: ['gallery', id] });
                  queryClient.invalidateQueries({ queryKey: ['galleries'] });
                  setShowEditGallery(false);
                  toast.success(t('common.save') + ' - OK');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('gallery.galleryName')}</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={gallery.name}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('gallery.description')}</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={gallery.description || ''}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                />
              </div>
              {/* Thumbnail selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('gallery.coverImage')}</label>
                {images.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('gallery.noImages')}</p>
                ) : (
                  <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto rounded-md border border-border p-2">
                    {images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={async () => {
                          await handleSetCover(img.id);
                        }}
                        className={`aspect-square overflow-hidden rounded-md border-2 ${
                          gallery.cover_image_id === img.id
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-transparent hover:border-foreground/30'
                        }`}
                      >
                        <img
                          src={`/api/images/${img.id}/thumbnail?token=${token}`}
                          alt={img.filename}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditGallery(false)} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
