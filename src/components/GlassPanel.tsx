import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

interface GlassPanelProps extends PropsWithChildren {
  className?: string;
  dragRegion?: boolean;
}

export const GlassPanel = ({ children, className, dragRegion = false }: GlassPanelProps) => (
  <div
    className={clsx('glass-panel', className)}
    {...(dragRegion ? { 'data-tauri-drag-region': true } : {})}
  >
    {children}
  </div>
);
