import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { AlertTriangle, X } from 'lucide-react';
import { deleteAccount, type UserProfile } from '@/api/auth';

export function DangerZoneSection({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation();
  const { logout } = useAuth0();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success(t('profile.deleteAccountSuccess'));
      logout({ logoutParams: { returnTo: window.location.origin } });
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h2 className="text-base font-semibold text-destructive">{t('profile.dangerZone')}</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t('profile.deleteAccountDesc')}</p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          {t('profile.deleteAccount')}
        </button>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{t('profile.deleteAccountConfirm')}</p>
            <button
              onClick={() => { setShowConfirm(false); setConfirmEmail(''); }}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{profile.email}</p>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={profile.email}
            className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowConfirm(false); setConfirmEmail(''); }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmEmail !== profile.email || deleting}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? t('common.loading') : t('profile.deleteAccount')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
