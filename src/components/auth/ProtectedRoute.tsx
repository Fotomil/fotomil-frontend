import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '@/api/client';
import { setCachedToken } from '@/api/images';

export function ProtectedRoute() {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    setTokenGetter(getAccessTokenSilently);
    getAccessTokenSilently().then((token) => {
      setCachedToken(token);
      // Lab users get redirected to lab dashboard when they hit photographer routes
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || payload['https://fotomil.xyz/role'];
        if (role === 'lab' && !window.location.pathname.startsWith('/lab')) {
          navigate('/lab/dashboard', { replace: true });
        }
      } catch { /* ignore */ }
    }).catch(() => {});
  }, [isAuthenticated, getAccessTokenSilently, navigate]);

  if (!isAuthenticated) {
    loginWithRedirect({
      authorizationParams: {
        ui_locales: localStorage.getItem('language') || 'sr',
      },
    });
    return null;
  }

  return <Outlet />;
}
