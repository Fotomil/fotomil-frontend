import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/api/client';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token, new_password: password });
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch {
      setError(t('auth.resetTokenInvalid'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-destructive">{t('auth.resetTokenInvalid')}</p>
          <Link to="/login" className="mt-4 text-sm font-medium text-foreground underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Camera className="h-10 w-10 text-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">{t('auth.newPassword')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
