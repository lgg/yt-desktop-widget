import type { PropsWithChildren, ReactNode } from 'react';

import { GlassPanel } from '@/components/GlassPanel';

interface SettingsSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const SettingsSection = ({
  title,
  description,
  actions,
  children,
}: SettingsSectionProps) => (
  <GlassPanel className="settings-section no-drag">
    <div className="settings-section__header">
      <div>
        <h2 className="settings-section__title">{title}</h2>
        {description ? <p className="settings-section__description">{description}</p> : null}
      </div>
      {actions ? <div className="settings-section__actions">{actions}</div> : null}
    </div>
    <div className="settings-section__body">{children}</div>
  </GlassPanel>
);

interface SettingsRowProps extends PropsWithChildren {
  className?: string;
}

export const SettingsRow = ({ children, className }: SettingsRowProps) => (
  <div className={className ? `settings-row ${className}` : 'settings-row'}>{children}</div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  label: string;
  description: string;
}

export const Toggle = ({ checked, onChange, label, description }: ToggleProps) => (
  <label className="toggle-row">
    <div className="toggle-row__main">
      <span className="toggle-row__label">{label}</span>
      <span className="toggle-row__control">
        <input
          className="toggle-row__input"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-row__visual" aria-hidden="true">
          <span className="toggle-row__thumb" />
        </span>
      </span>
    </div>
    <span className="toggle-row__description">{description}</span>
  </label>
);