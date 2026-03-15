import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_TIMESTAMP_AGE_SECONDS = 300;

export function verifyPaddleWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  const parts = signature.split(';');
  const tsEntry = parts.find((p) => p.startsWith('ts='));
  const h1Entry = parts.find((p) => p.startsWith('h1='));

  if (!tsEntry || !h1Entry) {
    return false;
  }

  const ts = tsEntry.slice(3);
  const h1 = h1Entry.slice(3);

  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > MAX_TIMESTAMP_AGE_SECONDS) {
    return false;
  }

  const payload = `${ts}:${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8')}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(h1, 'hex');

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}
