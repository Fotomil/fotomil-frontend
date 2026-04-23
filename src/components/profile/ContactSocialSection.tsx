import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Phone, Globe } from 'lucide-react';
import { updateProfile, type UserProfile } from '@/api/auth';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function ContactSocialSection({
  profile,
  onUpdated,
}: {
  profile: UserProfile;
  onUpdated: () => void;
}) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(profile.phone || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '');
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url || '');
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        phone: phone,
        website_url: websiteUrl,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
      });
      onUpdated();
      toast.success(t('profile.profileUpdated'));
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{t('profile.contactSocial')}</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t('profile.contactSocialDesc')}</p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Phone className="h-3.5 w-3.5" />
            {t('profile.phone')}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('profile.phonePlaceholder')}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Globe className="h-3.5 w-3.5" />
            {t('profile.websiteUrl')}
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder={t('profile.websiteUrlPlaceholder')}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <InstagramIcon className="h-3.5 w-3.5" />
            {t('profile.instagramUrl')}
          </label>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder={t('profile.instagramUrlPlaceholder')}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <FacebookIcon className="h-3.5 w-3.5" />
            {t('profile.facebookUrl')}
          </label>
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder={t('profile.facebookUrlPlaceholder')}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
