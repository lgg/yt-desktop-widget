export interface CompanionEndpoint {
  host: string;
  port: number;
}

const HTTP_URL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;

export const formatCompanionEndpoint = (host: string, port: number) => `${host}:${port}`;

export const parseCompanionEndpoint = (value: string): CompanionEndpoint | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = HTTP_URL_PATTERN.test(trimmed) ? trimmed : `http://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' || !url.hostname || !url.port) {
    return null;
  }

  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return {
    host: url.hostname,
    port,
  };
};
