import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Copy, Check, Trash2, Link, Eye, Edit3 } from 'lucide-react';
import {
  getShareLinks,
  createShareLink,
  updateShareLink,
  deleteShareLink,
  type ShareLink,
} from '@/api/shares';

interface Props {
  galleryId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareDialog({ galleryId, open, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newPermission, setNewPermission] = useState<'view' | 'edit'>('view');

  const { data: links = [] } = useQuery({
    queryKey: ['shares', galleryId],
    queryFn: () => getShareLinks(galleryId),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () => createShareLink(galleryId, newPermission, newLabel || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', galleryId] });
      setNewLabel('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateShareLink(id, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares', galleryId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShareLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares', galleryId] }),
  });

  const copyLink = (link: ShareLink) => {
    const url = `${window.location.origin}/shared/${link.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t('share.linkCopied'));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-2 w-full max-w-lg rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('share.shareGallery')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create new link */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('share.label')}</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Za Marka"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring focus:ring-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Permission</label>
            <select
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value as 'view' | 'edit')}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring focus:ring-1"
            >
              <option value="view">{t('share.viewOnly')}</option>
              <option value="edit">{t('share.viewAndEdit')}</option>
            </select>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Link className="h-3.5 w-3.5" />
            {t('share.createLink')}
          </button>
        </div>

        {/* Existing links */}
        {links.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">{t('share.noShareLinks')}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {links.map((link) => (
              <div
                key={link.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  link.is_active ? 'border-border bg-card' : 'border-border/50 bg-muted/50 opacity-60'
                }`}
              >
                {link.permission === 'view' ? (
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Edit3 className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{link.label || link.permission}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {link.is_active ? t('share.active') : t('share.inactive')}
                  </span>
                </div>
                <button
                  onClick={() => copyLink(link)}
                  className="rounded p-1 hover:bg-accent"
                  title={t('share.copyLink')}
                >
                  {copiedId === link.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: link.id, active: !link.is_active })}
                  className="rounded px-1.5 py-0.5 text-xs hover:bg-accent"
                >
                  {link.is_active ? t('share.deactivate') : t('share.active')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(link.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
