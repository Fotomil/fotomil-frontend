import { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Props {
  itemCount: number;
  renderItem: (index: number) => React.ReactNode;
  gap?: number;
}

/**
 * Virtual scrolling grid for images.
 * Only renders visible rows, with overscan for smooth scrolling.
 * Responsive columns based on container width.
 */
export function VirtualImageGrid({ itemCount, renderItem, gap = 12 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    if (w >= 1280) setColumns(6);
    else if (w >= 1024) setColumns(5);
    else if (w >= 768) setColumns(4);
    else if (w >= 640) setColumns(3);
    else setColumns(2);
  }, []);

  useEffect(() => {
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  const rowCount = Math.ceil(itemCount / columns);

  // Estimate row height: thumbnail aspect-square (~150px) + text (~40px) + padding
  const estimateSize = useCallback(() => {
    if (!containerRef.current) return 220;
    const colWidth = (containerRef.current.clientWidth - gap * (columns - 1)) / columns;
    return colWidth + 50 + gap; // square thumbnail + text + gap
  }, [columns, gap]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => document.documentElement,
    estimateSize,
    overscan: 3,
  });

  return (
    <div ref={containerRef} className="select-none">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columns;
          const endIdx = Math.min(startIdx + columns, itemCount);
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: `${gap}px`,
              }}
            >
              {Array.from({ length: endIdx - startIdx }, (_, i) => (
                <div key={startIdx + i}>{renderItem(startIdx + i)}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
