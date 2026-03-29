import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import client from '@/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/api/auth';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    client.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        // Refresh user data to update email_verified
        getMe().then(setUser).catch(() => {});
      })
      .catch(() => setStatus('error'));
  }, [token, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Camera className="mx-auto h-10 w-10 text-foreground" />

        {status === 'loading' && (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="text-xl font-semibold text-foreground">{t('auth.emailVerified')}</h1>
            <Link
              to="/"
              className="inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('auth.goToDashboard')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">{t('auth.verificationFailed')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.verificationFailedDesc')}</p>
            <Link to="/" className="text-sm font-medium text-foreground underline">
              {t('auth.goToDashboard')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
