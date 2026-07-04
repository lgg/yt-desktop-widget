import type { ConnectionStatus } from '@/domain/playback/types';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  label: string;
}

export const ConnectionBadge = ({ status, label }: ConnectionBadgeProps) => (
  <div className={`status-badge status-badge--${status}`}>
    <span className="status-badge__dot" />
    <span>{label}</span>
  </div>
);
