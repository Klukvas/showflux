import { createHmac } from 'node:crypto';
import { verifyPaddleWebhookSignature } from './paddle-webhook.util';

describe('verifyPaddleWebhookSignature', () => {
  const secret = 'test-webhook-secret';
  const body = '{"event_type":"subscription.activated"}';

  function buildSignature(ts: number, bodyStr: string, key: string): string {
    const payload = `${ts}:${bodyStr}`;
    const h1 = createHmac('sha256', key).update(payload).digest('hex');
    return `ts=${ts};h1=${h1}`;
  }

  it('should return true for valid signature', () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature(ts, body, secret);
    expect(verifyPaddleWebhookSignature(body, sig, secret)).toBe(true);
  });

  it('should return false for wrong secret', () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature(ts, body, 'wrong-secret');
    expect(verifyPaddleWebhookSignature(body, sig, secret)).toBe(false);
  });

  it('should return false for tampered body', () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature(ts, body, secret);
    expect(verifyPaddleWebhookSignature('tampered', sig, secret)).toBe(false);
  });

  it('should return false for expired timestamp', () => {
    const ts = Math.floor(Date.now() / 1000) - 600;
    const sig = buildSignature(ts, body, secret);
    expect(verifyPaddleWebhookSignature(body, sig, secret)).toBe(false);
  });

  it('should return false for missing ts in signature', () => {
    expect(verifyPaddleWebhookSignature(body, 'h1=abc123', secret)).toBe(
      false,
    );
  });

  it('should return false for missing h1 in signature', () => {
    expect(verifyPaddleWebhookSignature(body, 'ts=12345', secret)).toBe(false);
  });

  it('should accept Buffer body', () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature(ts, body, secret);
    expect(verifyPaddleWebhookSignature(Buffer.from(body), sig, secret)).toBe(
      true,
    );
  });
});
