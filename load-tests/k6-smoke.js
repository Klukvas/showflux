import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Smoke test: verify basic functionality under minimal load.
 * 10 virtual users, 30 seconds, p95 < 500ms.
 *
 * Usage: k6 run load-tests/k6-smoke.js
 */

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health response ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch {
        return false;
      }
    },
  });

  // Register (will 409 after first run — that's expected)
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: `loadtest_${__VU}_${__ITER}@test.local`,
      password: 'LoadTest123!',
      fullName: 'Load Test User',
      workspaceName: 'Load Test Workspace',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, {
    'register status 201 or 409': (r) =>
      r.status === 201 || r.status === 409,
  });

  // Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: `loadtest_${__VU}_${__ITER}@test.local`,
      password: 'LoadTest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, {
    'login status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}
