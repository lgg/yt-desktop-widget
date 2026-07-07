export interface CompanionEndpoint {
  host: string;
  port: number;
}

const HTTP_URL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;
const EXPLICIT_HTTP_PORT_PATTERN = /^http:\/\/(?:\[[^\]]+]|[^/:?#]+):(\d+)(?:[/?#]|$)/i;

const parsePort = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return port;
};

const getExplicitHttpPort = (candidate: string): number | null => {
  const match = candidate.match(EXPLICIT_HTTP_PORT_PATTERN);
  return parsePort(match?.[1] ?? null);
};

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

  if (url.protocol !== 'http:' || !url.hostname) {
    return null;
  }

  const port = parsePort(url.port) ?? getExplicitHttpPort(candidate);
  if (port == null) {
    return null;
  }

  return {
    host: url.hostname,
    port,
  };
};
