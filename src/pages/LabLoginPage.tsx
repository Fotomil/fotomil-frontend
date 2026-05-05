import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Camera } from 'lucide-react';

/**
 * Lab login uses the same Auth0 Universal Login as photographers.
 * After Auth0 returns, we read the access-token claims:
 *  - if `role === "lab"` → /lab/dashboard
 *  - otherwise          → /dashboard (regular photographer flow)
 */
export function LabLoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  // After login, route based on role claim
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessTokenSilently();
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || payload['https://fotomil.xyz/role'];
        if (cancelled) return;
        if (role === 'lab') navigate('/lab/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      } catch {
        navigate('/dashboard', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, getAccessTokenSilently, navigate]);

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        ui_locales: i18n.language,
        redirect_uri: `${window.location.origin}/lab/login`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Camera className="h-6 w-6 text-foreground" />
          <h1 className="text-lg font-semibold text-foreground">FotoMil</h1>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">{t('labPortal.loginTitle')}</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t('labPortal.loginAuth0Desc')}</p>

        <button
          onClick={handleLogin}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('labPortal.signInButton')}
        </button>
      </div>
    </div>
  );
}
