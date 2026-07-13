import { useState } from 'react';

import { AppProvider, useAppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { SettingsWindow } from '@/app/SettingsWindow';
import { ThemeProvider } from '@/app/theme';
import {
  getCurrentAppWindowLabel,
  type AppWindowLabel,
} from '@/app/windowController';
import { WidgetWindow } from '@/app/WidgetWindow';

const RoutedWindow = ({ windowLabel }: { windowLabel: AppWindowLabel }) =>
  windowLabel === 'settings' ? <SettingsWindow /> : <WidgetWindow />;

const LocalizedThemedApp = ({
  windowLabel,
}: {
  windowLabel: AppWindowLabel;
}) => {
  const { settings } = useAppModel();

  return (
    <I18nProvider locale={settings.ui.locale}>
      <ThemeProvider mode={settings.ui.themeMode}>
        <RoutedWindow windowLabel={windowLabel} />
      </ThemeProvider>
    </I18nProvider>
  );
};

export const AppRoot = () => {
  const [windowLabel] = useState<AppWindowLabel>(() =>
    getCurrentAppWindowLabel(),
  );

  return (
    <AppProvider windowLabel={windowLabel}>
      <LocalizedThemedApp windowLabel={windowLabel} />
    </AppProvider>
  );
};
