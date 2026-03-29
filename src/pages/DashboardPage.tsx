import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { CreateGalleryDialog } from '@/components/gallery/CreateGalleryDialog';
import { getGalleries, createGallery, deleteGallery } from '@/api/galleries';
import { Plus } from 'lucide-react';
import { GalleryCardSkeleton } from '@/components/ui/Skeleton';

export function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

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
    </div>
  );
}
