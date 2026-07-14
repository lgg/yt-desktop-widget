import type { PropsWithChildren, ReactNode } from 'react';

import { GlassPanel } from '@/components/GlassPanel';
import { ChevronDownIcon } from '@/components/icons';

interface SettingsSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
  sectionId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  expandLabel?: string;
  collapseLabel?: string;
}

export const SettingsSection = ({
  title,
  description,
  actions,
  sectionId,
  collapsed = false,
  onCollapsedChange,
  expandLabel,
  collapseLabel,
  children,
}: SettingsSectionProps) => {
  const bodyId = sectionId ? `settings-section-${sectionId}-body` : undefined;
  const collapsible = Boolean(onCollapsedChange && bodyId);

  return (
    <GlassPanel className="settings-section no-drag">
      <div className="settings-section__header">
        <div className="settings-section__copy">
          <h2 className="settings-section__title">
            {collapsible ? (
              <button
                className="settings-section__collapse-toggle"
                type="button"
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                aria-label={collapsed ? expandLabel : collapseLabel}
                onClick={() => onCollapsedChange?.(!collapsed)}
              >
                <span>{title}</span>
                <ChevronDownIcon
                  className={
                    collapsed
                      ? 'settings-section__collapse-icon settings-section__collapse-icon--collapsed'
                      : 'settings-section__collapse-icon'
                  }
                />
              </button>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p className="settings-section__description">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="settings-section__actions">{actions}</div>
        ) : null}
      </div>
      {!collapsed ? (
        <div id={bodyId} className="settings-section__body">
          {children}
        </div>
      ) : null}
    </GlassPanel>
  );
};

interface SettingsRowProps extends PropsWithChildren {
  className?: string;
}

export const SettingsRow = ({ children, className }: SettingsRowProps) => (
  <div className={className ? `settings-row ${className}` : 'settings-row'}>
    {children}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  label: string;
  description: string;
}

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: ToggleProps) => (
  <label className="toggle-row">
    <div className="toggle-row__main">
      <span className="toggle-row__label">{label}</span>
      <span className="toggle-row__control">
        <input
          className="toggle-row__input"
          type="checkbox"
          aria-label={label}
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
