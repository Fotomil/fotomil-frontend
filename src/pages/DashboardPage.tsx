import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { CreateGalleryDialog } from '@/components/gallery/CreateGalleryDialog';
import { getGalleries, createGallery, deleteGallery } from '@/api/galleries';
import { getMe } from '@/api/auth';
import { Plus, Camera, Images, Share2, X } from 'lucide-react';
import { GalleryCardSkeleton } from '@/components/ui/Skeleton';

export function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ['galleries'],
    queryFn: getGalleries,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      createGallery(name, description || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGallery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    },
  });

  useEffect(() => {
    if (isLoading || galleries.length > 0) return;
    if (localStorage.getItem('welcome_dismissed')) return;
    getMe().then((me) => {
      if (!me.branding_name && !me.branding_logo_url) {
        setShowWelcome(true);
      }
    }).catch(() => {});
  }, [isLoading, galleries.length]);

  const dismissWelcome = () => {
    localStorage.setItem('welcome_dismissed', '1');
    setShowWelcome(false);
  };

  const handleDelete = (id: string) => {
    toast(t('gallery.deleteConfirm'), {
      action: {
        label: t('common.delete'),
        onClick: () => deleteMutation.mutate(id),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-2 py-6 sm:px-4 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t('gallery.myGalleries')}</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('gallery.createGallery')}
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <GalleryCardSkeleton key={i} />)}
          </div>
        ) : galleries.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">{t('gallery.noGalleries')}</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleries.map((gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onDelete={handleDelete}
                onEdit={() => navigate(`/gallery/${gallery.id}?edit=true`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateGalleryDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(name, description) => createMutation.mutate({ name, description })}
        loading={createMutation.isPending}
      />

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={dismissWelcome}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-5 text-center text-lg font-semibold text-foreground">
              {t('welcome.title')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('welcome.step1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('welcome.step1Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Images className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('welcome.step2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('welcome.step2Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('welcome.step3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('welcome.step3Desc')}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={dismissWelcome}
                className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                {t('welcome.skip')}
              </button>
              <button
                onClick={() => { dismissWelcome(); navigate('/profile'); }}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('welcome.goToProfile')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
