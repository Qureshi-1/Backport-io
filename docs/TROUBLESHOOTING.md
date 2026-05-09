# Troubleshooting

Common issues and their solutions for Backport cloud users. If you don't find your issue here, check the [API Reference](./api-reference.md) or open an issue on GitHub.

---

## Common Issues

### 403 Forbidden — WAF Blocked Request

Your request is being blocked by the Web Application Firewall. This typically happens when the WAF's pattern detection identifies something in your request body, query parameters, or URL path that resembles a known attack pattern.

**Symptoms:** Requests return `403` with a JSON body containing `detail: "Request blocked by WAF"` and the rule that was triggered.

**Solutions:**

1. **Disable the WAF temporarily** to confirm it's the cause. Go to Dashboard → Settings → Security → Toggle WAF OFF. If the request succeeds, the WAF is the culprit.
2. **Check your request payload.** Look for legitimate content that might match attack patterns — for example, a user's bio that contains `<script>` tags (XSS detection), a search query with SQL keywords like `SELECT` or `DROP` (SQLi detection), or file paths containing `../` (path traversal detection).
3. **Create a custom WAF rule** to allow your specific use case. Navigate to Dashboard → WAF → Custom Rules and add a regex pattern that matches your legitimate traffic with action set to `allow`.
4. **Reduce WAF sensitivity.** If you're getting frequent false positives on a specific category (e.g., XSS), you can disable that category individually in Settings → Security → WAF Configuration.

---

### 429 Too Many Requests — Rate Limit Exceeded

Your client or application is sending more requests than your plan allows within the rate-limit window.

**Symptoms:** Requests return `429` with a `Retry-After` header indicating how many seconds to wait.

**Solutions:**

1. **Enable response caching.** If your API returns data that doesn't change frequently, enable LRU caching in the dashboard under Endpoints → Caching. Cached responses are served instantly without counting against your rate limit for subsequent identical requests.
2. **Optimize your request patterns.** Batch multiple API calls into a single request where possible, or use polling intervals instead of rapid-fire requests. Implement client-side debouncing for user-driven events.
3. **Upgrade your plan.** If you're consistently hitting the limit, review the [FAQ billing section](./FAQ.md#what-are-the-plan-limits) for plan details. Upgrades take effect immediately.
4. **Check for unintended loops.** If you have a webhook configured, ensure it doesn't trigger a chain reaction of recursive API calls to your own proxy endpoint.

---

### 502 Bad Gateway — Backend Unreachable

Backport cannot connect to your backend server. This means the proxy received your request but failed to forward it to the upstream backend.

**Symptoms:** Requests return `502 Bad Gateway` or `504 Gateway Timeout`.

**Solutions:**

1. **Verify your `BACKEND_URL`** environment variable. Ensure it's set correctly and includes the protocol:

   ```bash
   # Correct
   BACKEND_URL=https://api.yoursite.com

   # Incorrect (missing protocol)
   BACKEND_URL=api.yoursite.com
   ```

2. **Ensure your backend is running and healthy.** Try making a direct request to your backend URL (bypassing Backport) using `curl` or your browser. If it's down, start or restart your backend service.

3. **Check for CORS issues on your backend.** If your backend returns CORS headers, ensure it accepts requests from Backport's domain (`backport.in`). If your backend explicitly whitelists origins, you may need to add Backport's URL.

4. **Check network connectivity.** If your backend is on a private network, ensure the machine running Backport can reach it. Test with `curl` from the Backport server itself.

5. **Review backend timeouts.** If your backend takes longer than 30 seconds to respond, Backport will return a `504`. Consider optimizing slow endpoints or increasing the proxy timeout in your configuration.

---

### API Key Not Working

Requests are being rejected with an authentication error despite providing your API key.

**Symptoms:** Requests return `401 Unauthorized` or `403 Forbidden` with `detail: "Invalid or missing API key"`.

**Solutions:**

1. **Verify the header format.** The API key must be sent in the `X-API-Key` header with the correct prefix:

   ```bash
   # Correct
   curl -H "X-API-Key: bk_live_xxxxxxxxxxxxx" https://backport.in/proxy/your-path/data

   # Incorrect — wrong header name
   curl -H "Authorization: bk_live_xxxxxxxxxxxxx" https://backport.in/proxy/your-path/data

   # Incorrect — missing prefix
   curl -H "X-API-Key: xxxxxxxxxxxxxx" https://backport.in/proxy/your-path/data
   ```

2. **Regenerate your API key.** If you've recently changed keys, make sure you're using the latest one. Old keys are immediately invalidated upon regeneration. Go to Dashboard → Settings → API Keys → Regenerate.

3. **Check if the key was deleted.** Review the API Keys section in the dashboard to confirm the key still exists. If it was accidentally deleted, create a new one.

4. **Check for typos.** API keys are long strings — copy and paste directly from the dashboard rather than typing manually. Watch for trailing whitespace or missing characters.

5. **Verify the key matches the environment.** API keys are environment-specific. If you have multiple Backport instances, remember that each maintains its own key store.

---

### CORS Errors in the Browser

Your frontend application is failing to make requests to the Backport proxy due to Cross-Origin Resource Sharing (CORS) restrictions.

**Symptoms:** Browser console shows errors like `Access-Control-Allow-Origin`, `blocked by CORS policy`, or `preflight response failed`.

**Solutions:**

1. **Add your frontend origin to `CORS_ORIGINS`.** In your backend's environment configuration, ensure your frontend's origin is listed:

   ```bash
   CORS_ORIGINS=https://your-frontend.vercel.app,https://localhost:3000
   ```

   Separate multiple origins with commas. Include the protocol (`https://`) and do not add a trailing slash.

2. **Check your backend framework** (Express, FastAPI, Django, etc.) has CORS middleware configured to accept the origin of your frontend application.

3. **Verify the proxy is forwarding CORS headers.** Backport forwards CORS headers from your backend by default. If your backend doesn't set CORS headers, the browser will block the response. You can configure Backport to inject CORS headers by adding them in the response transformation rules.

4. **Check for preflight (OPTIONS) request handling.** Some backends don't handle `OPTIONS` requests properly. Ensure your backend responds to `OPTIONS` with appropriate `Access-Control-Allow-*` headers.

---

### Database Connection Errors

Backport is unable to connect to its database, causing startup failures or runtime errors.

**Symptoms:** Logs show `OperationalError`, `Connection refused`, or `no such table` messages. The dashboard fails to load.

**Solutions:**

1. **Verify your `DATABASE_URL`** environment variable. The format depends on your database:

   ```bash
   # SQLite (default for development)
   DATABASE_URL=sqlite:///./backport.db

   # PostgreSQL
   DATABASE_URL=postgresql://user:password@localhost:5432/backport
   ```

2. **For SQLite:** Ensure the directory containing the `.db` file exists and is writable by the process running Backport. On Linux/macOS, check permissions with `ls -la` and fix with `chmod` if needed.

   ```bash
   # Check if the file is writable
   ls -la /path/to/backport.db

   # Fix permissions
   chmod 664 /path/to/backport.db
   ```

3. **For PostgreSQL:** Ensure the PostgreSQL server is running and accepting connections:

   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql

   # Test connectivity
   psql -h localhost -U user -d backport -c "SELECT 1;"
   ```

   Verify that the username, password, host, and port in your `DATABASE_URL` are correct.

4. **Run database migrations.** If you've updated Backport to a new version, run migrations to ensure your schema is up to date:

   ```bash
   cd backend
   alembic upgrade head
   ```

---

### Email Verification Not Received

You signed up but never received the verification email.

**Solutions:**

1. **Check your spam/junk folder.** Verification emails are sometimes caught by aggressive spam filters. Search your inbox for emails from `noreply@backport.in` or the domain configured in your `FROM_EMAIL` environment variable.

2. **Verify your `RESEND_API_KEY`** is configured correctly. Backport uses [Resend](https://resend.com) for email delivery. Check that your API key is valid:

   ```bash
   # Verify the key is set
   echo $RESEND_API_KEY

   # It should start with "re_"
   ```

   You can generate a new API key from the Resend dashboard at [resend.com/api-keys](https://resend.com/api-keys).

3. **Verify your `FROM_EMAIL`** is configured and verified in Resend. Resend requires you to verify sending domains before you can send emails from them:

   ```bash
   # In your environment
   FROM_EMAIL=noreply@your-domain.com
   ```

   If you're using a custom domain, go to Resend → Domains → Add Domain and follow the DNS verification steps.

4. **Resend the verification email.** If available, use the "Resend verification" link on the login page. If not, try signing up again with the same email address.

---

### Slow Response Times

Requests through Backport are taking noticeably longer than direct backend access.

**Solutions:**

1. **Enable LRU caching.** For endpoints that return data which doesn't change on every request (e.g., product listings, user profiles), enable caching:

   ```
   Dashboard → Endpoints → [Select Endpoint] → Enable Caching → Set TTL
   ```

   Cached responses are served from memory in under 1ms, bypassing the backend entirely for subsequent requests.

2. **Check your backend performance.** Add the response time to your backend's logging and compare it against Backport's proxy latency (shown in the analytics dashboard). If the backend itself is slow, Backport can't make it faster — you'll need to optimize your database queries, add indexing, or scale your backend infrastructure.

3. **Enable WAF selectively.** The WAF adds a small amount of latency per request due to pattern matching. If you have endpoints that don't need WAF protection (e.g., internal health checks, public read-only data), you can disable WAF for those specific endpoints while keeping it active for sensitive ones.

4. **Monitor the circuit breaker.** If your backend is intermittently failing, the circuit breaker may be routing traffic through a degraded path. Check Dashboard → Monitoring for circuit breaker status and review any open circuits.

5. **Check network latency.** If your backend is hosted in a different region, geographic distance adds latency. Co-locate your backend and use Backport's cloud for optimal performance.

---

## Docker Issues

### Container Won't Start

The Docker container exits immediately or fails to start.

**Solutions:**

1. **Check for port conflicts.** By default, Backport's backend runs on port 8000 and the frontend on port 3000. If these ports are already in use, you'll see an error like `address already in use`. Either stop the conflicting service or change the port mapping in `docker-compose.yml`:

   ```yaml
   ports:
     - "8001:8000"  # Map container port 8000 to host port 8001
   ```

2. **Review Docker logs** for the exact error:

   ```bash
   # View logs for the backend container
   docker compose logs backend

   # View logs for the frontend container
   docker compose logs frontend

   # Follow logs in real-time
   docker compose logs -f
   ```

3. **Verify your environment variables.** Open your `.env` file and ensure all required variables are set. Missing or malformed values (e.g., an invalid `DATABASE_URL`) will cause the container to crash on startup.

4. **Rebuild the containers** if you've made changes to the code or configuration:

   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

---

### Database Migration Errors

Database schema is out of sync after an update, causing errors like `no such column` or `relation already exists`.

**Solutions:**

1. **Run migrations manually** from within the container:

   ```bash
   docker compose exec backend alembic upgrade head
   ```

2. **For SQLite (development only):** If migrations are corrupted or you don't need to preserve data, you can delete the database file and let Backport recreate it on startup:

   ```bash
   docker compose down
   rm backend/backport.db  # or wherever your SQLite file is located
   docker compose up -d
   ```

   **Warning:** This deletes all stored data including API keys, user accounts, and analytics. Only use this for development environments.

3. **Check migration version.** View the current migration state:

   ```bash
   docker compose exec backend alembic current
   ```

   Compare this against the available versions in `backend/alembic/versions/`. If a migration is marked as applied but the table doesn't exist, you may need to stamp the database to an earlier version and re-run:

   ```bash
   docker compose exec backend alembic stamp base
   docker compose exec backend alembic upgrade head
   ```

---

## Setup Issues

### `pip install` Fails

Python package installation fails during manual setup.

**Solutions:**

1. **Verify your Python version.** Backport requires **Python 3.10 or later**. Check your version:

   ```bash
   python3 --version
   # Expected output: Python 3.10.x or higher
   ```

   If you have an older version, install Python 3.10+ using [pyenv](https://github.com/pyenv/pyenv), your system package manager, or [python.org](https://www.python.org/downloads/).

2. **Upgrade pip** before installing dependencies:

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Use a virtual environment** to avoid conflicts with system packages:

   ```bash
   python3 -m venv venv
   source venv/bin/activate    # Linux/macOS
   # venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   ```

4. **Install build dependencies** if you're on a minimal system:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3-dev libffi-dev

   # macOS (with Homebrew)
   brew install python@3.10 openssl
   ```

5. **Try a specific index** if your default pip mirror is unreliable:

   ```bash
   pip install -r requirements.txt -i https://pypi.org/simple/
   ```

---

### `npm run dev` Errors

The frontend development server fails to start or throws errors at runtime.

**Solutions:**

1. **Clean install your dependencies.** Corrupted `node_modules` is the most common cause:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

2. **Verify your Node.js version.** Backport's frontend requires **Node.js 18 or later** (20.x recommended):

   ```bash
   node --version
   # Expected output: v18.x.x or v20.x.x
   ```

   If you need to upgrade, use [nvm](https://github.com/nvm-sh/nvm):

   ```bash
   nvm install 20
   nvm use 20
   ```

3. **Check for missing environment variables.** The frontend may require environment variables for API endpoints. Copy the example env file:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Clear Next.js cache** if you see stale build artifacts:

   ```bash
   rm -rf .next
   npm run dev
   ```

5. **Check port availability.** Next.js defaults to port 3000. If it's in use, either stop the conflicting process or start on a different port:

   ```bash
   npm run dev -- -p 3001
   ```

---

## Still Need Help?

If none of the solutions above resolve your issue:

1. **Check the logs** — run `docker compose logs -f` (Docker) or check your terminal output (manual setup) for detailed error messages.
2. **Search existing issues** — check the [GitHub Issues](https://github.com/backport/backport/issues) page for similar problems and solutions.
3. **Open a new issue** — include your environment details (OS, Python/Node version, deployment method), the full error message, and steps to reproduce the problem.
4. **Join the community** — ask questions in the Backport Discord or discussion forum for real-time help from the maintainers and community members.
