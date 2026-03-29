import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Camera } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/api/auth';
import client from '@/api/client';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [brandingName, setBrandingName] = useState(user?.branding_name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await client.patch('/auth/profile', { branding_name: brandingName || null });
      const updated = await getMe();
      setUser(updated);
      toast.success(t('common.save') + ' - OK');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await client.post('/auth/profile/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = await getMe();
      setUser(updated);
      toast.success(t('common.save') + ' - OK');
    } catch {
      toast.error('Logo must be JPG, PNG, or WebP under 2MB');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await client.patch('/auth/profile', { branding_logo_url: '' });
      const updated = await getMe();
      setUser(updated);
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-xl px-2 py-6 sm:px-4">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{t('profile.title')}</h1>
        </div>

        <div className="space-y-6">
          {/* Account info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">{t('profile.account')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('auth.email')}</span>
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('auth.fullName')}</span>
                <span className="text-foreground">{user?.full_name}</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-medium text-foreground">{t('profile.branding')}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{t('profile.brandingDesc')}</p>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('profile.brandingName')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brandingName}
                    onChange={(e) => setBrandingName(e.target.value)}
                    placeholder="e.g. Milan Photography"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>

              {/* Logo upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('profile.brandingLogo')}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-foreground/30 hover:bg-muted/50"
                >
                  {user?.branding_logo_url ? (
                    <img
                      src={user.branding_logo_url}
                      alt="Logo"
                      className="h-24 w-24 rounded-xl border border-border object-contain bg-background p-1"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {uploading ? t('common.loading') : user?.branding_logo_url ? t('profile.changeLogo') : t('profile.uploadLogo')}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('profile.brandingLogoHint')}</p>
                  </div>
                </div>
                {user?.branding_logo_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                    className="text-sm text-destructive hover:underline"
                  >
                    {t('common.delete')} logo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadLogo(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Preview */}
              {(brandingName || user?.branding_logo_url) && (
                <div className="rounded-md border border-border bg-muted p-3">
                  <p className="mb-2 text-xs text-muted-foreground">{t('profile.preview')}</p>
                  <div className="flex items-center gap-2">
                    {user?.branding_logo_url ? (
                      <img src={user.branding_logo_url} alt="" className="h-6 w-6 rounded object-contain" />
                    ) : (
                      <Camera className="h-5 w-5 text-foreground" />
                    )}
                    <div>
                      {brandingName && <span className="text-xs text-muted-foreground">{brandingName}</span>}
                      <span className="ml-2 font-semibold text-foreground">Gallery Name</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
