import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, Mail } from 'lucide-react';
import { sendLabLoginLink, setLabToken, getLabMe } from '@/api/lab-portal';

export function LabLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // If token in URL, auto-login
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setLabToken(token);
      getLabMe()
        .then(() => navigate('/lab/dashboard', { replace: true }))
        .catch(() => toast.error(t('labPortal.loginFailed')));
    }
  }, [searchParams, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await sendLabLoginLink(email.trim());
      setSent(true);
    } catch {
      toast.error('Failed to send link');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Camera className="h-6 w-6 text-foreground" />
          <h1 className="text-lg font-semibold text-foreground">FotoMil</h1>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">{t('labPortal.loginTitle')}</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t('labPortal.loginDesc')}</p>

        {sent ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Mail className="mx-auto mb-2 h-6 w-6" />
            {t('labPortal.linkSent')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('labPortal.email')}
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? t('common.loading') : t('labPortal.sendLink')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
