import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import type { UserProfile } from '@/api/auth';

export function AccountSection({ profile, auth0Name }: { profile: UserProfile; auth0Name?: string }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{t('profile.account')}</h2>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('auth.email')}</span>
          <span className="text-foreground">{profile.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('auth.fullName')}</span>
          <span className="text-foreground">{profile.full_name || auth0Name}</span>
        </div>
      </div>
    </div>
  );
}
