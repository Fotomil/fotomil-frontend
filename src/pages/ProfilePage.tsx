import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { Header } from '@/components/layout/Header';
import { AccountSection } from '@/components/profile/AccountSection';
import { ContactSocialSection } from '@/components/profile/ContactSocialSection';
import { BrandingSection } from '@/components/profile/BrandingSection';
import { SecuritySection } from '@/components/profile/SecuritySection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { getMe, type UserProfile } from '@/api/auth';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: auth0User } = useAuth0();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);

  const loadProfile = useCallback(() => {
    getMe().then((data) => {
      setProfile(data);
      setProfileVersion((v) => v + 1);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{t('profile.title')}</h1>
        </div>

        {profile && (
          <div className="space-y-6">
            <AccountSection profile={profile} auth0Name={auth0User?.name} />
            <ContactSocialSection key={`contact-${profileVersion}`} profile={profile} onUpdated={loadProfile} />
            <BrandingSection key={`branding-${profileVersion}`} profile={profile} onUpdated={loadProfile} />
            <SecuritySection />
            <DangerZoneSection profile={profile} />
          </div>
        )}
      </main>
    </div>
  );
}
