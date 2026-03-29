import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Sun, Moon, Globe, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/api/client';
import { useTheme } from '@/hooks/use-theme';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'sr' ? 'en' : 'sr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResendVerification = async () => {
    try {
      await client.post('/auth/resend-verification');
      toast.success(t('auth.verificationSent'));
    } catch {
      toast.error(t('auth.verificationSendFailed'));
    }
  };

  return (
    <>
    {isAuthenticated && user && !user.email_verified && (
      <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
        <Mail className="h-4 w-4 shrink-0" />
        <span>{t('auth.emailNotVerified')}</span>
        <button onClick={handleResendVerification} className="font-medium underline hover:no-underline">
          {t('auth.resendVerification')}
        </button>
      </div>
    )}
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-2 sm:px-4">
        <button
          onClick={() => navigate('/')}
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
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:px-2"
                title={t('profile.title')}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">{user.full_name}</span>
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
    </>
  );
}
