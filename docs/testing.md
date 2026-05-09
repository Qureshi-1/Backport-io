# Testing Guide

This document covers how to run, write, and structure tests for the Backport backend.

---

## Running Tests

### Prerequisites

```bash
cd backend
pip install -r requirements.txt
```

### Run All Tests

```bash
# From the project root
python -m pytest backend/tests/ -v

# From the backend directory
cd backend
pytest tests/ -v
```

### Run a Specific Test File

```bash
python -m pytest backend/tests/test_auth.py -v
python -m pytest backend/tests/test_proxy.py -v
python -m pytest backend/tests/test_waf.py -v
python -m pytest backend/tests/test_custom_waf.py -v
```

### Run a Single Test

```bash
python -m pytest backend/tests/test_auth.py::test_signup -v
```

### Run with Coverage

```bash
pip install pytest-cov
python -m pytest backend/tests/ -v --cov=backend --cov-report=term-missing
```

### Run Tests in Parallel

```bash
pip install pytest-xdist
python -m pytest backend/tests/ -v -n auto
```

---

## Test Structure and Conventions

```
backend/tests/
├── __init__.py          # Package marker
├── conftest.py          # Shared fixtures (db, client, test_user, auth_headers)
├── test_auth.py         # Authentication & OAuth tests
├── test_proxy.py        # Proxy forwarding, WAF, rate limiting, caching tests
├── test_waf.py          # Built-in WAF pattern matching tests
└── test_custom_waf.py   # User-defined custom WAF rule tests
```

### Naming Conventions

- Test files: `test_<module>.py`
- Test functions: `test_<behavior_description>`
- Test classes: `Test<FeatureName>`

### Test Database

Tests use an **in-memory SQLite database** (shared across the session) that is automatically
rolled back after each test function. No external database is required.

### Environment Variables

The test environment is configured in `conftest.py` **before any app imports**:

| Variable | Test Value |
|---|---|
| `ENVIRONMENT` | `test` |
| `SECRET_KEY` | `test-secret-key-for-pytesting-minimum-32chars` |
| `ADMIN_EMAIL` | `admin@test.com` |
| `ADMIN_SECRET` | `test-admin-secret-key-for-testing` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `DATABASE_URL` | `sqlite:///file:memdb1?mode=memory&cache=shared&uri=true` |

---

## How to Write New Tests

### Available Fixtures (from `conftest.py`)

| Fixture | Scope | Description |
|---|---|---|
| `engine` | session | SQLAlchemy test engine (in-memory SQLite) |
| `db` | function | Fresh database session, rolled back after each test |
| `client` | session | FastAPI `TestClient` with overridden `get_db` dependency |
| `test_user` | function | A pre-created verified user with `plan="free"` and a target backend URL |
| `auth_headers` | function | Authentication cookies (JWT) for the `test_user` |

### Example: Testing an Authenticated Endpoint

```python
def test_get_settings(client, auth_headers):
    """Test that authenticated users can fetch their settings."""
    response = client.get("/api/user/settings", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "rate_limit_enabled" in data
    assert "caching_enabled" in data
```

### Example: Testing with a Custom User

```python
def test_pro_user_rate_limit(client, db):
    """Test that Pro users get higher rate limits."""
    import bcrypt
    from models import User, ApiKey
    from auth import create_access_token

    # Create a Pro user
    hashed = bcrypt.hashpw("propassword123".encode(), bcrypt.gensalt()).decode()
    user = User(
        email="pro@example.com",
        hashed_password=hashed,
        plan="pro",
        is_verified=True,
        target_backend_url="https://httpbin.org",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create API key
    api_key = ApiKey(user_id=user.id, name="Default Gateway")
    db.add(api_key)
    db.commit()

    # Get auth headers
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    headers = {"Cookie": f"auth_token={token}"}

    response = client.get("/api/user/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["plan"] == "pro"
```

### Example: Testing an Admin Endpoint

```python
def test_admin_stats(client, db):
    """Test that admin users can access admin stats."""
    import bcrypt
    from models import User, ApiKey
    from auth import create_access_token

    # Create admin user
    hashed = bcrypt.hashpw("adminpass123".encode(), bcrypt.gensalt()).decode()
    admin = User(
        email="admin@test.com",
        hashed_password=hashed,
        plan="free",
        is_admin=True,
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    api_key = ApiKey(user_id=admin.id, name="Default Gateway")
    db.add(api_key)
    db.commit()

    token = create_access_token(data={"sub": str(admin.id), "email": admin.email})
    headers = {"Cookie": f"auth_token={token}"}

    response = client.get("/api/admin/stats", headers=headers)
    assert response.status_code == 200
    assert "total_users" in response.json()
```

### Example: Testing Error Cases

```python
def test_unauthorized_access(client):
    """Test that unauthenticated requests return 401."""
    response = client.get("/api/user/me")
    assert response.status_code == 401


def test_create_api_key_plan_limit(client, auth_headers):
    """Test that free users can only create 1 API key."""
    # test_user is already on the free plan with 1 key
    response = client.post(
        "/api/user/keys",
        json={"name": "Second Key"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "limit" in response.json()["detail"].lower()
```

---

## Frontend Testing

Frontend testing infrastructure has not been added yet. When implemented, it will likely use:

- **Vitest** or **Jest** for unit tests
- **Playwright** or **Cypress** for E2E tests

---

## CI Testing Pipeline

Tests run automatically on every push and pull request via GitHub Actions.
See `.github/workflows/ci.yml` for the full configuration.

The CI pipeline:

1. Sets up Python with the required version
2. Installs backend dependencies
3. Runs `pytest` with verbose output
4. Fails the build if any test fails

To run tests locally the same way CI does:

```bash
python -m pytest backend/tests/ -v --tb=short
```
