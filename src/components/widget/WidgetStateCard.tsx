import type { ReactNode } from 'react';

import { GlassPanel } from '@/components/GlassPanel';

interface WidgetStateCardProps {
  eyebrow?: string;
  title?: string;
  body?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export const WidgetStateCard = ({
  eyebrow,
  title,
  body,
  actions,
  compact = false,
}: WidgetStateCardProps) => (
  <GlassPanel className={compact ? 'state-card state-card--compact' : 'state-card'}>
    {eyebrow ? <span className="state-card__eyebrow">{eyebrow}</span> : null}
    {title ? <h2 className="state-card__title">{title}</h2> : null}
    {body ? <p className="state-card__body">{body}</p> : null}
    {actions ? <div className="state-card__actions">{actions}</div> : null}
  </GlassPanel>
);