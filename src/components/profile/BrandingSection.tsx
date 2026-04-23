import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Palette, Camera } from 'lucide-react';
import { updateProfile, type UserProfile } from '@/api/auth';
import client from '@/api/client';

export function BrandingSection({
  profile,
  onUpdated,
}: {
  profile: UserProfile;
  onUpdated: () => void;
}) {
  const { t } = useTranslation();
  const [brandingName, setBrandingName] = useState(profile.branding_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        branding_name: brandingName,
        bio: bio,
      });
      onUpdated();
      toast.success(t('profile.profileUpdated'));
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
      onUpdated();
      toast.success(t('profile.profileUpdated'));
    } catch {
      toast.error('Logo must be JPG, PNG, or WebP under 2MB');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateProfile({ branding_logo_url: '' });
      onUpdated();
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{t('profile.branding')}</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t('profile.brandingDesc')}</p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('profile.brandingName')}</label>
          <input
            type="text"
            value={brandingName}
            onChange={(e) => setBrandingName(e.target.value)}
            placeholder="e.g. Milan Photography"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('profile.bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder={t('profile.bioPlaceholder')}
            rows={3}
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">
            {t('profile.bioHint')} ({bio.length}/500)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('profile.brandingLogo')}</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-foreground/30 hover:bg-muted/50"
          >
            {profile.branding_logo_url ? (
              <img
                src={profile.branding_logo_url}
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
                {uploading ? t('common.loading') : profile.branding_logo_url ? t('profile.changeLogo') : t('profile.uploadLogo')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('profile.brandingLogoHint')}</p>
            </div>
          </div>
          {profile.branding_logo_url && (
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

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t('common.save')}
        </button>

        {(brandingName || profile.branding_logo_url) && (
          <>
            <hr className="border-border" />
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="mb-2 text-xs text-muted-foreground">{t('profile.preview')}</p>
              <div className="flex items-center gap-2">
                {profile.branding_logo_url ? (
                  <img src={profile.branding_logo_url} alt="" className="h-6 w-6 rounded object-contain" />
                ) : (
                  <Camera className="h-5 w-5 text-foreground" />
                )}
                <div>
                  {brandingName && <span className="text-xs text-muted-foreground">{brandingName}</span>}
                  <span className="ml-2 font-semibold text-foreground">Gallery Name</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
