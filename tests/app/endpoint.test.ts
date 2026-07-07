import { describe, expect, it } from 'vitest';

import { formatCompanionEndpoint, parseCompanionEndpoint } from '@/app/endpoint';

describe('Companion endpoint helpers', () => {
  it('formats the stored host and port as an editable endpoint', () => {
    expect(formatCompanionEndpoint('127.0.0.1', 9863)).toBe('127.0.0.1:9863');
  });

  it('parses host:port input', () => {
    expect(parseCompanionEndpoint('127.0.0.1:9863')).toEqual({
      host: '127.0.0.1',
      port: 9863,
    });
  });

  it('normalizes a pasted Companion API URL to host and port', () => {
    expect(parseCompanionEndpoint('http://127.0.0.1:9863/api/v1/state')).toEqual({
      host: '127.0.0.1',
      port: 9863,
    });
  });

  it('rejects endpoints without a valid port', () => {
    expect(parseCompanionEndpoint('127.0.0.1')).toBeNull();
    expect(parseCompanionEndpoint('127.0.0.1:0')).toBeNull();
    expect(parseCompanionEndpoint('127.0.0.1:70000')).toBeNull();
  });
});
