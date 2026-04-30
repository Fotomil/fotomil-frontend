import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Power, Check, X as XIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import {
  checkAdmin, getAdminLabs, createLab, updateLab, deleteLab,
  addLabProduct, updateLabProduct, deleteLabProduct,
} from '@/api/admin';
import type { Lab } from '@/api/labs';
import {
  listLabApplications, approveLabApplication, rejectLabApplication,
  type LabApplication,
} from '@/api/lab-applications';

function LabCard({ lab, onUpdated }: { lab: Lab; onUpdated: () => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lab.name);
  const [email, setEmail] = useState(lab.email);
  const [address, setAddress] = useState(lab.address || '');
  const [phone, setPhone] = useState(lab.phone || '');
  const [website, setWebsite] = useState(lab.website || '');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  const handleSave = async () => {
    try {
      await updateLab(lab.id, { name, email, address: address || null, phone: phone || null, website: website || null });
      setEditing(false);
      onUpdated();
      toast.success(t('common.save'));
    } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async () => {
    try {
      await updateLab(lab.id, { is_active: !lab.is_active });
      onUpdated();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try { await deleteLab(lab.id); onUpdated(); }
    catch { toast.error('Failed — lab may have orders'); }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      await addLabProduct(lab.id, { name: newProductName.trim(), price: parseFloat(newProductPrice) });
      setNewProductName('');
      setNewProductPrice('');
      onUpdated();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try { await deleteLabProduct(productId); onUpdated(); }
    catch { toast.error('Failed'); }
  };

  const handleUpdateProductPrice = async (productId: string, price: string) => {
    const val = parseFloat(price);
    if (isNaN(val)) return;
    try { await updateLabProduct(productId, { price: val }); onUpdated(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className={`rounded-xl border bg-card ${lab.is_active ? 'border-border' : 'border-border/50 opacity-60'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="flex flex-1 items-center gap-2 text-left">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <div>
            <span className="font-medium text-foreground">{lab.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">{lab.email}</span>
            {!lab.is_active && (
              <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {t('admin.inactive')}
              </span>
            )}
          </div>
        </button>
        <span className="text-xs text-muted-foreground">{lab.products.length} {t('admin.products').toLowerCase()}</span>
        <button onClick={handleToggleActive} className="rounded p-1 text-muted-foreground hover:bg-accent" title={lab.is_active ? 'Deactivate' : 'Activate'}>
          <Power className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="rounded p-1 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Lab details */}
          {editing ? (
            <div className="space-y-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t('admin.labName')} className={inputClass} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder={t('admin.labEmail')} className={inputClass} />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder={t('admin.labAddress')} className={inputClass} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('admin.labPhone')} className={inputClass} />
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder={t('admin.labWebsite')} className={inputClass} />
              <div className="flex gap-2">
                <button onClick={handleSave} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">{t('common.save')}</button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground space-y-0.5">
              {lab.address && <p>{lab.address}</p>}
              {lab.phone && <p>{lab.phone}</p>}
              {lab.website && <p>{lab.website}</p>}
              <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">{t('admin.editLab')}</button>
            </div>
          )}

          {/* Products */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('admin.products')}</h4>
            <div className="space-y-1.5">
              {[...lab.products].sort((a, b) => a.sort_order - b.sort_order).map(product => (
                <div key={product.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-foreground">{product.name}</span>
                  <input
                    type="number"
                    defaultValue={product.price}
                    onBlur={e => handleUpdateProductPrice(product.id, e.target.value)}
                    className="w-20 rounded border border-input bg-background px-2 py-1 text-right text-xs"
                  />
                  <span className="text-xs text-muted-foreground">{product.currency}</span>
                  <button onClick={() => handleDeleteProduct(product.id)} className="rounded p-0.5 text-destructive/60 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add product */}
            <div className="mt-3 flex items-center gap-2">
              <input
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                placeholder={t('admin.productName')}
                className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-xs"
              />
              <input
                type="number"
                value={newProductPrice}
                onChange={e => setNewProductPrice(e.target.value)}
                placeholder={t('admin.productPrice')}
                className="w-20 rounded border border-input bg-background px-2 py-1.5 text-right text-xs"
              />
              <button
                onClick={handleAddProduct}
                disabled={!newProductName.trim() || !newProductPrice}
                className="rounded bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const APP_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function ApplicationsTab() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<LabApplication[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    const status = filter === 'all' ? undefined : filter;
    listLabApplications(status).then(setApplications).catch(() => {});
  };

  useEffect(load, [filter]);

  const handleApprove = async (app: LabApplication) => {
    if (!confirm(t('admin.applications.confirmApprove'))) return;
    try {
      await approveLabApplication(app.id);
      toast.success(t('admin.applications.approvedToast'));
      load();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (app: LabApplication) => {
    try {
      await rejectLabApplication(app.id, rejectReason || null);
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {t(`admin.applications.${f}`)}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.applications.noApplications')}</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{app.lab_name}</h3>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${APP_STATUS_COLORS[app.status]}`}>
                      {t(`admin.applications.${app.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{app.lab_email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {app.lab_phone && <p><strong>{t('admin.applications.phone')}:</strong> {app.lab_phone}</p>}
                {app.lab_address && <p><strong>{t('admin.applications.address')}:</strong> {app.lab_address}</p>}
                {app.lab_website && <p><strong>{t('admin.applications.website')}:</strong> {app.lab_website}</p>}
                {app.message && (
                  <div className="mt-2 rounded-lg bg-muted p-3 text-xs">
                    <strong>{t('admin.applications.message')}:</strong> {app.message}
                  </div>
                )}
                {app.status === 'rejected' && app.rejection_reason && (
                  <p className="text-xs italic"><strong>{t('admin.applications.rejectionReason')}:</strong> {app.rejection_reason}</p>
                )}
              </div>

              {app.status === 'pending' && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleApprove(app)}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    <Check className="h-3 w-3" />
                    {t('admin.applications.approve')}
                  </button>
                  {rejectingId === app.id ? (
                    <>
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t('admin.applications.rejectReasonPlaceholder')}
                        className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => handleReject(app)}
                        className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('admin.applications.reject')}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setRejectingId(app.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      <XIcon className="h-3 w-3" />
                      {t('admin.applications.reject')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'labs' | 'applications'>('labs');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const loadLabs = () => { getAdminLabs().then(setLabs).catch(() => {}); };

  useEffect(() => {
    checkAdmin().then(ok => {
      setIsAdmin(ok);
      if (ok) loadLabs();
    }).catch(() => setIsAdmin(false));
  }, []);

  const handleCreateLab = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    try {
      await createLab({ name: newName.trim(), email: newEmail.trim() });
      setNewName('');
      setNewEmail('');
      setShowCreate(false);
      loadLabs();
    } catch { toast.error('Failed'); }
  };

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  if (isAdmin === null) return null;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-3 py-20 text-center">
        <p className="text-lg text-muted-foreground">{t('admin.accessDenied')}</p>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-semibold text-foreground">{t('admin.title')}</h1>
          {tab === 'labs' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t('admin.addLab')}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          <button
            onClick={() => setTab('labs')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'labs' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t('admin.tabLabs')}
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'applications' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t('admin.tabApplications')}
          </button>
        </div>

        {tab === 'labs' && (
          <>
            {showCreate && (
              <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">{t('admin.addLab')}</h3>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('admin.labName')} className={inputClass} />
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={t('admin.labEmail')} className={inputClass} />
                <div className="flex gap-2">
                  <button onClick={handleCreateLab} disabled={!newName.trim() || !newEmail.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{t('common.create')}</button>
                  <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent">{t('common.cancel')}</button>
                </div>
              </div>
            )}

            {labs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.noLabs')}</p>
            ) : (
              <div className="space-y-3">
                {labs.map(lab => <LabCard key={lab.id} lab={lab} onUpdated={loadLabs} />)}
              </div>
            )}
          </>
        )}

        {tab === 'applications' && <ApplicationsTab />}
      </main>
    </div>
  );
}
