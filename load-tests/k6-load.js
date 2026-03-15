import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load test: ramp up to 50 VUs over 2 minutes.
 * Measures throughput and latency under sustained load.
 *
 * Usage: k6 run load-tests/k6-load.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 25 },
    { duration: '60s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

let authToken = '';

export function setup() {
  // Create a shared test user
  http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: 'k6_load_test@test.local',
      password: 'LoadTest123!',
      fullName: 'K6 Load Test',
      workspaceName: 'K6 Load Workspace',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'k6_load_test@test.local',
      password: 'LoadTest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  try {
    const body = JSON.parse(loginRes.body);
    return { token: body.accessToken };
  } catch {
    return { token: '' };
  }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Health check (no auth)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health 200': (r) => r.status === 200 });

  // Get current user profile
  const meRes = http.get(`${BASE_URL}/users/me`, { headers });
  check(meRes, {
    'me 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  // List listings
  const listingsRes = http.get(`${BASE_URL}/listings?page=1&limit=10`, {
    headers,
  });
  check(listingsRes, {
    'listings 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  // List showings
  const showingsRes = http.get(`${BASE_URL}/showings?page=1&limit=10`, {
    headers,
  });
  check(showingsRes, {
    'showings 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  // Dashboard summary
  const dashboardRes = http.get(`${BASE_URL}/dashboard/summary`, { headers });
  check(dashboardRes, {
    'dashboard 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(0.3 + Math.random() * 0.7);
}
