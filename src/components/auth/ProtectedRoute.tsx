import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '@/api/client';
import { setCachedToken } from '@/api/images';

export function ProtectedRoute() {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(getAccessTokenSilently);
      // Cache token for image URL query params
      getAccessTokenSilently().then(setCachedToken).catch(() => {});
    }
  }, [isAuthenticated, getAccessTokenSilently]);

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
