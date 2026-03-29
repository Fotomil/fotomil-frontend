import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2 } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  onDownload: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ImageContextMenu({ x, y, onDownload, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 50,
  };

  return (
    <div ref={ref} style={style} className="w-48 rounded-md border border-border bg-card py-1 shadow-lg">
      <button
        onClick={() => { onDownload(); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
      >
        <Download className="h-4 w-4" />
        {t('export.downloadImage')}
      </button>
      <div className="my-1 border-t border-border" />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        {t('common.delete')}
      </button>
    </div>
  );
}
