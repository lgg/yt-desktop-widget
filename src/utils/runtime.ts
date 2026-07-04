declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isTauriRuntime = () =>
  typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__ !== 'undefined';
