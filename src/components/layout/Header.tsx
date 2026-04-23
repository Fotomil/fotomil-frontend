import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Sun, Moon, Globe, User as UserIcon, Shield } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useState, useEffect } from 'react';
import { checkAdmin } from '@/api/admin';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkAdmin().then(setIsAdmin).catch(() => {});
    }
  }, [isAuthenticated]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'sr' ? 'en' : 'sr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-2 sm:px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-lg font-semibold text-foreground hover:opacity-80"
        >
          <Camera className="h-5 w-5" />
          <span className="hidden sm:inline">{t('common.appName')}</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:px-2"
            title={i18n.language === 'sr' ? 'English' : 'Srpski'}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated && user && (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:px-2"
                  title={t('admin.title')}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:px-2"
                title={t('profile.title')}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">{user.name}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:px-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
