import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

export function LoginPage() {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (!isLoading) {
      loginWithRedirect({
        authorizationParams: {
          ui_locales: localStorage.getItem('language') || 'sr',
        },
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Camera className="h-10 w-10 text-foreground" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
