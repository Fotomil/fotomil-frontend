import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import client from '@/api/client';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
    } catch {
      // Always show success to prevent email enumeration
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Camera className="h-10 w-10 text-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">{t('auth.forgotPassword')}</h1>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{t('auth.resetEmailSent')}</p>
            <Link to="/login" className="text-sm font-medium text-foreground underline hover:no-underline">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('auth.forgotPasswordDesc')}</p>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-foreground underline hover:no-underline">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
