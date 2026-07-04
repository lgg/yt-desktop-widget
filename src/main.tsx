import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/manrope';

import { AppRoot } from '@/app/AppRoot';
import '@/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
