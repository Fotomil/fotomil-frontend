import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { Camera, LogOut, Download, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  getLabMe, getLabOrders, updateLabOrderStatus, getLabDownloadUrl,
  getLabProducts, addLabProduct, updateLabProduct, deleteLabProduct,
  type LabMe, type LabProduct,
} from '@/api/lab-portal';
import type { Order } from '@/api/orders';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function LabDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout, loginWithRedirect } = useAuth0();
  const [me, setMe] = useState<LabMe | null>(null);
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<LabProduct[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  const loadProducts = () => getLabProducts().then(setProducts).catch(() => {});

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      loginWithRedirect({ authorizationParams: { redirect_uri: `${window.location.origin}/lab/login` } });
      return;
    }
    getLabMe()
      .then((data) => {
        setMe(data);
        getLabOrders().then(setOrders);
        loadProducts();
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          toast.error(t('labPortal.notALab'));
        }
        navigate('/lab/login', { replace: true });
      });
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate, t]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const updated = await updateLabOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch { toast.error('Failed to update status'); }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleDownload = async (orderId: string) => {
    const token = await getAccessTokenSilently();
    window.location.href = getLabDownloadUrl(orderId, token);
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      await addLabProduct({ name: newProductName.trim(), price: parseFloat(newProductPrice) });
      setNewProductName('');
      setNewProductPrice('');
      loadProducts();
    } catch { toast.error('Failed to add product'); }
  };

  const handleUpdateProductPrice = async (productId: string, price: string) => {
    const val = parseFloat(price);
    if (isNaN(val)) return;
    try { await updateLabProduct(productId, { price: val }); loadProducts(); }
    catch { toast.error('Failed'); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try { await deleteLabProduct(productId); loadProducts(); }
    catch { toast.error('Failed'); }
  };

  if (!me) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="text-sm font-semibold text-foreground">FotoMil - {me.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            {t('labPortal.logout')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          <button
            onClick={() => setTab('orders')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'orders' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t('labPortal.myOrders')}
          </button>
          <button
            onClick={() => setTab('products')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'products' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t('admin.products')}
          </button>
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products yet. Add your first product below.</p>
            ) : (
              <div className="rounded-lg border border-border bg-card">
                {[...products].sort((a, b) => a.sort_order - b.sort_order).map((product) => (
                  <div key={product.id} className="flex items-center gap-2 border-b border-border/50 px-4 py-3 text-sm last:border-0">
                    <span className="flex-1 text-foreground">{product.name}</span>
                    <input
                      type="number"
                      defaultValue={product.price}
                      onBlur={(e) => handleUpdateProductPrice(product.id, e.target.value)}
                      className="w-24 rounded border border-input bg-background px-2 py-1 text-right text-xs"
                    />
                    <span className="text-xs text-muted-foreground">{product.currency}</span>
                    <button onClick={() => handleDeleteProduct(product.id)} className="rounded p-1 text-destructive/60 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add product row */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3">
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder={t('admin.productName')}
                className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder={t('admin.productPrice')}
                className="w-28 rounded border border-input bg-background px-3 py-2 text-right text-sm"
              />
              <button
                onClick={handleAddProduct}
                disabled={!newProductName.trim() || !newProductPrice}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t('admin.addProduct')}
              </button>
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('labPortal.noOrders')}</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const expanded = expandedId === order.id;
                  return (
                    <div key={order.id} className="rounded-lg border border-border bg-card">
                      <button
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {order.client_name || t('order.orderedBy')}
                            </span>
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                              {t(`order.${order.status}`)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {order.items.length} stavki · {order.total_price} {order.currency}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {expanded && (
                        <div className="space-y-3 border-t border-border px-4 py-3">
                          {order.client_email && (
                            <p className="text-xs text-muted-foreground">
                              <strong>{t('labPortal.client')}:</strong> {order.client_name} · {order.client_email}
                              {order.client_phone ? ` · ${order.client_phone}` : ''}
                            </p>
                          )}
                          {order.note && (
                            <p className="text-xs text-muted-foreground">
                              <strong>{t('order.note')}:</strong> {order.note}
                            </p>
                          )}

                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="pb-1">{t('image.filename')}</th>
                                <th className="pb-1">{t('order.product')}</th>
                                <th className="pb-1 text-center">{t('order.quantity')}</th>
                                <th className="pb-1 text-right">{t('order.lineTotal')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.id} className="border-t border-border/50">
                                  <td className="py-1">{item.image_filename}</td>
                                  <td className="py-1">{item.product_name}</td>
                                  <td className="py-1 text-center">{item.quantity}</td>
                                  <td className="py-1 text-right">{item.line_total} {order.currency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDownload(order.id)}
                              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <Download className="h-3 w-3" />
                              {t('labPortal.downloadImages')}
                            </button>
                            <span className="text-xs text-muted-foreground">{t('order.status')}:</span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className="rounded border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="pending">{t('order.pending')}</option>
                              <option value="confirmed">{t('order.confirmed')}</option>
                              <option value="completed">{t('order.completed')}</option>
                              <option value="cancelled">{t('order.cancelled')}</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
