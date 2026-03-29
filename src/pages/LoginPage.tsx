import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { login, getMe } from '@/api/auth';
import { Camera } from 'lucide-react';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokens = await login(email, password, rememberMe);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await getMe();
      setUser(user);
      navigate('/');
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Camera className="h-10 w-10 text-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">{t('common.appName')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm text-muted-foreground">{t('auth.rememberMe')}</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="font-medium text-foreground underline hover:no-underline">
            {t('auth.forgotPasswordLink')}
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-foreground underline hover:no-underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
