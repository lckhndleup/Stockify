# Configuration

This app reads API base URL in the following order:

1. EXPO_PUBLIC_API_URL (env at build-time)
2. app.json -> expo.extra.apiUrl
3. Fallback hardcoded URL (for safety)

Recommended:

- For local/dev: copy .env.example to .env and adjust if needed.
- For CI/EAS builds: set EXPO_PUBLIC_API_URL as a secret/environment variable.

Notes:

- Variables prefixed with EXPO*PUBLIC* are embedded into the JS bundle. Never put secrets in them.
- app.json `expo.extra.apiUrl` is a convenient default when env is not provided.

## API timeout

Default network timeout is configurable and read in this order:

1. `EXPO_PUBLIC_API_TIMEOUT_MS` (env)
2. `app.json -> expo.extra.apiTimeoutMs`
3. Fallback: `60000` ms (60 seconds)

Tip: Increased from 15s to 60s to accommodate slower server responses. Adjust if needed.
