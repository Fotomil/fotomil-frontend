import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, MapPin, ChevronRight, CheckCircle } from 'lucide-react';
import { getLabs, type Lab, type LabProduct } from '@/api/labs';
import { createSharedOrder, createOrder, type OrderItemInput } from '@/api/orders';
import type { ImageData } from '@/api/images';

interface Props {
  open: boolean;
  onClose: () => void;
  galleryId: string;
  images: ImageData[];
  mode: 'client' | 'photographer';
  shareToken?: string;
}

export function OrderPrintsDialog({ open, onClose, galleryId, images, mode, shareToken }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const orderableImages = images.filter((img) => img.num_copies > 0);

  useEffect(() => {
    if (open) {
      getLabs().then(setLabs).catch(() => {});
      setStep(1);
      setSelectedLab(null);
      setProductSelections({});
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setNote('');
    }
  }, [open]);

  // Set default product for each image when lab is selected
  useEffect(() => {
    if (selectedLab && selectedLab.products.length > 0) {
      const sorted = [...selectedLab.products].sort((a, b) => a.sort_order - b.sort_order);
      const defaultId = sorted[0].id;
      const defaults: Record<string, string> = {};
      for (const img of orderableImages) {
        defaults[img.id] = defaultId;
      }
      setProductSelections(defaults);
    }
  }, [selectedLab]);

  if (!open) return null;

  const getProduct = (productId: string): LabProduct | undefined =>
    selectedLab?.products.find((p) => p.id === productId);

  const grandTotal = orderableImages.reduce((sum, img) => {
    const product = getProduct(productSelections[img.id]);
    return sum + (product ? product.price * img.num_copies : 0);
  }, 0);

  const currency = selectedLab?.products[0]?.currency || 'RSD';

  const handleSubmit = async () => {
    if (mode === 'client' && (!clientName.trim() || !clientEmail.trim())) {
      toast.error(t('order.clientInfo'));
      return;
    }

    setSubmitting(true);
    try {
      const items: OrderItemInput[] = orderableImages.map((img) => ({
        image_id: img.id,
        quantity: img.num_copies,
        product_id: productSelections[img.id],
      }));

      const data = {
        lab_id: selectedLab!.id,
        items,
        ...(mode === 'client' || clientName
          ? {
              client_info: {
                name: clientName,
                email: clientEmail,
                phone: clientPhone || undefined,
              },
            }
          : {}),
        note: note || undefined,
      };

      if (mode === 'client' && shareToken) {
        await createSharedOrder(shareToken, data);
      } else {
        await createOrder(galleryId, data);
      }

      setStep(3);
    } catch {
      toast.error('Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {step === 1 && t('order.selectLab')}
            {step === 2 && t('order.orderSummary')}
            {step === 3 && t('order.orderSubmitted')}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Lab Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {orderableImages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('order.noImagesSelected')}</p>
              ) : labs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : (
                labs.map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => {
                      setSelectedLab(lab);
                      setStep(2);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{lab.name}</p>
                      {lab.address && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {lab.address}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lab.products.length} {t('order.products')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Order Summary */}
          {step === 2 && selectedLab && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('order.lab')}: <strong className="text-foreground">{selectedLab.name}</strong>
              </p>

              {/* Items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2">{t('image.filename')}</th>
                      <th className="pb-2">{t('order.product')}</th>
                      <th className="pb-2 text-center">{t('order.quantity')}</th>
                      <th className="pb-2 text-right">{t('order.unitPrice')}</th>
                      <th className="pb-2 text-right">{t('order.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderableImages.map((img) => {
                      const product = getProduct(productSelections[img.id]);
                      const lineTotal = product ? product.price * img.num_copies : 0;
                      return (
                        <tr key={img.id} className="border-b border-border/50">
                          <td className="py-2 pr-2">
                            <span className="block max-w-[150px] truncate">{img.filename}</span>
                          </td>
                          <td className="py-2 pr-2">
                            <select
                              value={productSelections[img.id] || ''}
                              onChange={(e) =>
                                setProductSelections((prev) => ({ ...prev, [img.id]: e.target.value }))
                              }
                              className="rounded border border-input bg-background px-2 py-1 text-xs"
                            >
                              {[...selectedLab.products]
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} — {p.price} {p.currency}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="py-2 text-center">{img.num_copies}</td>
                          <td className="py-2 text-right">{product?.price ?? 0}</td>
                          <td className="py-2 text-right font-medium">{lineTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td colSpan={4} className="pt-3 text-right">
                        {t('order.grandTotal')}:
                      </td>
                      <td className="pt-3 text-right">
                        {grandTotal} {currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Client info (client mode or optional for photographer) */}
              {mode === 'client' && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground">{t('order.clientInfo')}</h3>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={t('order.clientName')}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder={t('order.clientEmail')}
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={t('order.clientPhone')}
                    className={inputClass}
                  />
                </div>
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('order.note')}
                rows={2}
                className={inputClass}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  {t('order.back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || orderableImages.length === 0}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? t('common.loading') : t('order.submitOrder')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">{t('order.orderSubmitted')}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{t('order.orderSubmittedDesc')}</p>
              <button
                onClick={onClose}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
