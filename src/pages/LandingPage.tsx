import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Camera, Images, Palette, Download, Globe, Sun, Moon, Users, Settings, Zap } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { LabApplicationDialog } from '@/components/lab/LabApplicationDialog';

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showLabDialog, setShowLabDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    loginWithRedirect({
      authorizationParams: {
        ui_locales: i18n.language,
        screen_hint: 'signup',
      },
    });
  };

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        ui_locales: i18n.language,
      },
    });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'sr' ? 'en' : 'sr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const features = [
    { icon: Camera, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: Images, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: Palette, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { icon: Download, title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Camera className="h-5 w-5" />
            FotoMil
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
            <button
              onClick={() => navigate('/lab/login')}
              className="hidden rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:inline-block"
            >
              {t('landing.forLabs.loginAsLab')}
            </button>
            <button
              onClick={handleLogin}
              className="ml-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('auth.login')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t('landing.hero')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t('landing.heroDesc')}
        </p>
        <button
          onClick={handleGetStarted}
          className="mt-10 rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('landing.getStarted')}
        </button>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              {t('landing.trustedByBadge')}
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t('landing.trustedBy')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              {t('landing.trustedByDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <f.icon className="mb-3 h-6 w-6 text-foreground" />
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Labs */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('landing.forLabs.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              {t('landing.forLabs.desc')}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Users, title: t('landing.forLabs.benefit1Title'), desc: t('landing.forLabs.benefit1Desc') },
              { icon: Settings, title: t('landing.forLabs.benefit2Title'), desc: t('landing.forLabs.benefit2Desc') },
              { icon: Zap, title: t('landing.forLabs.benefit3Title'), desc: t('landing.forLabs.benefit3Desc') },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <b.icon className="mb-3 h-6 w-6 text-foreground" />
                <h3 className="text-base font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => setShowLabDialog(true)}
              className="rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('landing.forLabs.applyButton')}
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('landing.forLabs.alreadyPartner')}{' '}
              <button
                onClick={() => navigate('/lab/login')}
                className="font-medium text-foreground underline hover:no-underline"
              >
                {t('landing.forLabs.loginAsLab')}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t('landing.alreadyHaveAccount')}{' '}
            <button onClick={handleLogin} className="font-medium text-foreground underline hover:no-underline">
              {t('auth.login')}
            </button>
          </p>
        </div>
      </section>

      <LabApplicationDialog open={showLabDialog} onClose={() => setShowLabDialog(false)} />
    </div>
  );
}
