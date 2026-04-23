import { useState, useEffect, useRef, type ReactNode, type ComponentType } from 'react';

interface DropdownItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Props {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items, align = 'right' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full z-50 mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg ${align === 'left' ? 'left-0' : 'right-0'}`}>
          {items.map((item) => {
            const content = (
              <>
                <item.icon className="h-4 w-4" />
                {item.label}
              </>
            );
            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {content}
              </a>
            ) : (
              <button
                key={item.label}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
