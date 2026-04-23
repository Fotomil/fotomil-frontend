import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ExpandableText({
  text,
  maxLength = 150,
  className = '',
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const needsTruncation = text.length > maxLength;

  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {needsTruncation && !expanded ? text.slice(0, maxLength) + '\u2026' : text}
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-primary hover:underline"
        >
          {expanded ? t('common.showLess') : t('common.showMore')}
        </button>
      )}
    </p>
  );
}
