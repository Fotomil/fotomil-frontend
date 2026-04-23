import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera, FileSpreadsheet, Archive, FileDown, Download, ChevronDown, X, Square, CheckSquare, Globe, Sun, Moon, Printer,
} from 'lucide-react';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ImageViewer } from '@/components/image/ImageViewer';
import { OrderPrintsDialog } from '@/components/order/OrderPrintsDialog';
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
  downloadSharedImagesZip,
} from '@/api/shared-access';
import type { ImageData } from '@/api/images';
import { useViewerStore } from '@/stores/viewer-store';
import { VirtualImageGrid } from '@/components/image/VirtualImageGrid';
import { useTheme } from '@/hooks/use-theme';
import { ExpandableText } from '@/components/ui/ExpandableText';

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

export function SharedGalleryPage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isViewerOpen, openViewer } = useViewerStore();
  useTheme();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
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
            {info?.branding_name && (
              <span className="text-sm font-medium text-foreground">{info.branding_name}</span>
            )}
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
        <div className="mb-2 flex items-center gap-2 sm:mb-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{info?.gallery_name ?? '...'}</h1>
          </div>
          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {editable ? t('share.viewAndEdit') : t('share.viewOnly')}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5 sm:mb-6 sm:gap-2">
          <DropdownMenu
            align="left"
            trigger={
              <button
                disabled={downloading || images.length === 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
              >
                <Download className="h-4 w-4 shrink-0" />
                {downloading ? downloadProgress : t('export.downloadImages')}
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            }
            items={[
              { icon: Archive, label: `${t('export.downloadZip')} (${images.length})`, onClick: () => handleDownloadZip() },
              { icon: FileDown, label: `${t('export.downloadIndividual')} (${images.length})`, onClick: () => handleDownloadIndividual(images.map(i => i.id)) },
            ]}
          />
          {editable && (
            <>
              <a
                href={`/api/shared/${token}/export/csv`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent sm:px-3 sm:py-2 sm:text-sm"
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                {t('export.exportPrintOrder')}
              </a>
              <button
                onClick={() => setShowOrderDialog(true)}
                disabled={images.filter(i => i.num_copies > 0).length === 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
              >
                <Printer className="h-4 w-4 shrink-0" />
                {t('order.orderPrints')}
              </button>
            </>
          )}
        </div>
        {info?.gallery_description && (
          <ExpandableText text={info.gallery_description} maxLength={150} className="mb-2" />
        )}
        {info?.bio && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            {info.branding_logo_url ? (
              <img src={info.branding_logo_url} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded object-contain" />
            ) : (
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              {info.branding_name && (
                <p className="text-xs font-medium text-foreground">{info.branding_name}</p>
              )}
              <p className="text-xs italic text-muted-foreground">{info.bio}</p>
            </div>
          </div>
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
        <ImageViewer
          images={images}
          onCopiesChanged={invalidateImages}
          showCopies={editable}
          imageUrlFn={(imageId, size) => getSharedImageUrl(token!, imageId, size as 'original' | 'medium' | 'thumbnail')}
          saveCopiesFn={editable ? async (imageId, copies) => { await updateSharedCopies(token!, imageId, copies); } : undefined}
          commentsLoadFn={async (imageId) => getComments(token!, imageId)}
          onDownloadImage={(imageId) => downloadSharedSingleImage(token!, imageId)}
          onAddComment={async (imageId, name, text) => addComment(token!, imageId, name, text)}
        />
      )}

      {info && (
        <OrderPrintsDialog
          open={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
          galleryId=""
          images={images}
          mode="client"
          shareToken={token!}
        />
      )}
    </div>
  );
}
