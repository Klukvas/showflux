# Load Tests

Load tests use [k6](https://k6.io/) — a modern load testing tool.

## Install k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - <k6-smoke.js
```

## Run Tests

Make sure the API is running on `http://localhost:3001`:

```bash
# Smoke test (10 VU, 30s, p95 < 500ms)
k6 run load-tests/k6-smoke.js

# Load test (ramp to 50 VU, 2min)
k6 run load-tests/k6-load.js

# Custom base URL
k6 run -e BASE_URL=https://api.showflux.com load-tests/k6-smoke.js
```

## Thresholds

| Test | VUs | Duration | p95 | p99 | Fail Rate |
|------|-----|----------|-----|-----|-----------|
| Smoke | 10 | 30s | < 500ms | - | < 1% |
| Load | 50 | 2min | < 1000ms | < 2000ms | < 5% |
