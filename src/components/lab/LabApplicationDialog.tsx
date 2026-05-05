import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, CheckCircle } from 'lucide-react';
import { applyForLabPartnership } from '@/api/lab-applications';
import axios from 'axios';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LabApplicationDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [labName, setLabName] = useState('');
  const [labEmail, setLabEmail] = useState('');
  const [labPhone, setLabPhone] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labWebsite, setLabWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setLabName('');
      setLabEmail('');
      setLabPhone('');
      setLabAddress('');
      setLabWebsite('');
      setMessage('');
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim() || !labEmail.trim()) return;
    setSubmitting(true);
    try {
      await applyForLabPartnership({
        lab_name: labName.trim(),
        lab_email: labEmail.trim(),
        lab_phone: labPhone.trim() || undefined,
        lab_address: labAddress.trim() || undefined,
        lab_website: labWebsite.trim() || undefined,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const detail = err.response?.data?.detail || '';
          if (detail.includes('partner')) toast.error(t('labApplication.alreadyPartner'));
          else toast.error(t('labApplication.alreadyApplied'));
        } else if (err.response?.status === 429) {
          toast.error(t('labApplication.rateLimited'));
        } else {
          toast.error(t('labApplication.errorGeneric'));
        }
      } else {
        toast.error(t('labApplication.errorGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {submitted ? t('labApplication.success') : t('labApplication.formTitle')}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <p className="mb-6 text-sm text-muted-foreground">{t('labApplication.successDesc')}</p>
              <button
                onClick={onClose}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="mb-3 text-sm text-muted-foreground">{t('labApplication.formDesc')}</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('labApplication.labName')} *</label>
                <input value={labName} onChange={(e) => setLabName(e.target.value)} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('labApplication.labEmail')} *</label>
                <input
                  type="email"
                  value={labEmail}
                  onChange={(e) => setLabEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('labApplication.labPhone')}</label>
                  <input value={labPhone} onChange={(e) => setLabPhone(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('labApplication.labWebsite')}</label>
                  <input
                    type="url"
                    value={labWebsite}
                    onChange={(e) => setLabWebsite(e.target.value)}
                    placeholder="https://"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('labApplication.labAddress')}</label>
                <input value={labAddress} onChange={(e) => setLabAddress(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('labApplication.message')}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('labApplication.messagePlaceholder')}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !labName.trim() || !labEmail.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? t('common.loading') : t('labApplication.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
