import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Shield, Mail, KeyRound } from 'lucide-react';
import { requestPasswordReset, getIdentities, type Identity } from '@/api/auth';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function providerIcon(provider: string) {
  if (provider.includes('google')) return <GoogleIcon className="h-4 w-4" />;
  if (provider.includes('facebook')) return <FacebookIcon className="h-4 w-4" />;
  return <Mail className="h-4 w-4" />;
}

function providerLabel(provider: string) {
  if (provider.includes('google')) return 'Google';
  if (provider.includes('facebook')) return 'Facebook';
  return 'Email';
}

export function SecuritySection() {
  const { t } = useTranslation();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [sending, setSending] = useState(false);
  const isEmailUser = identities.some((i) => i.provider === 'auth0');

  useEffect(() => {
    getIdentities().then(setIdentities).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    setSending(true);
    try {
      await requestPasswordReset();
      toast.success(t('profile.changePasswordSent'));
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{t('profile.security')}</h2>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">{t('profile.changePassword')}</h3>
          </div>
          {isEmailUser ? (
            <>
              <p className="mb-3 text-xs text-muted-foreground">{t('profile.changePasswordDesc')}</p>
              <button
                onClick={handleChangePassword}
                disabled={sending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                {t('profile.changePassword')}
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t('profile.changePasswordSocial')}</p>
          )}
        </div>

        {identities.length > 0 && (
          <div>
            <hr className="mb-5 border-border" />
            <h3 className="mb-3 text-sm font-medium text-foreground">{t('profile.connectedAccounts')}</h3>
            <div className="space-y-2">
              {identities.map((identity) => (
                <div
                  key={identity.provider}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm"
                >
                  {providerIcon(identity.provider)}
                  <span className="text-foreground">{providerLabel(identity.provider)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
