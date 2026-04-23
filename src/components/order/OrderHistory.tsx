import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getGalleryOrders, updateOrderStatus } from '@/api/orders';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function OrderHistory({ galleryId }: { galleryId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', galleryId],
    queryFn: () => getGalleryOrders(galleryId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', galleryId] }),
  });

  if (orders.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t('order.noOrders')}</p>;
  }

  return (
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
                  <span className="font-medium text-foreground">{order.lab.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                    {t(`order.${order.status}`)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {order.client_name || t('order.orderedBy')}: {order.client_name || '—'} · {order.items.length} {t('gallery.images')} · {order.total_price} {order.currency}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {expanded && (
              <div className="border-t border-border px-4 py-3">
                <table className="mb-3 w-full text-xs">
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

                {order.note && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    <strong>{t('order.note')}:</strong> {order.note}
                  </p>
                )}

                {order.client_email && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {order.client_name} · {order.client_email} {order.client_phone ? `· ${order.client_phone}` : ''}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('order.updateStatus')}:</span>
                  <select
                    value={order.status}
                    onChange={(e) => statusMutation.mutate({ orderId: order.id, status: e.target.value })}
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
  );
}
