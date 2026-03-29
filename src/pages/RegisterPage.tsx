import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { register, getMe } from '@/api/auth';
import { Camera } from 'lucide-react';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokens = await register(email, password, fullName);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await getMe();
      setUser(user);
      navigate('/');
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as Record<string, unknown>).response === 'object'
      ) {
        const response = (err as { response: { status: number } }).response;
        if (response.status === 409) {
          setError(t('auth.emailTaken'));
          return;
        }
      }
      setError('Registration failed');
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
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
              {t('auth.fullName')}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
          </div>

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
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-foreground underline hover:no-underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
