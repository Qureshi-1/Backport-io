"""
Shared test fixtures for Backport backend tests.
"""
import os
import sys
import pytest

# ─── CRITICAL: Set env vars BEFORE any app imports ──────────────────────────────
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytesting-minimum-32chars"
os.environ["ADMIN_EMAIL"] = "admin@test.com"
os.environ["ADMIN_SECRET"] = "test-admin-secret-key-for-testing"
os.environ["FRONTEND_URL"] = "http://localhost:3000"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["DATABASE_URL"] = "sqlite:///file:memdb1?mode=memory&cache=shared&uri=true"
os.environ["DB_PATH"] = ""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base, SessionLocal


# ─── In-memory test database ──────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite:///file:memdb1?mode=memory&cache=shared&uri=true"


@pytest.fixture(scope="session")
def engine():
    """Create a test database engine (in-memory SQLite, shared)."""
    _engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=_engine)
    yield _engine
    _engine.dispose()


@pytest.fixture(scope="function")
def db(engine):
    """Create a fresh database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="session")
def client(engine):
    """Create a FastAPI TestClient for the full app with test DB."""
    from main import app
    from dependencies import get_db

    # Override the get_db dependency to use test engine
    TestSession = sessionmaker(bind=engine)

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    _client = TestClient(app)
    yield _client
    app.dependency_overrides.clear()


# ─── Mock user helpers ───────────────────────────────────────────────────────

@pytest.fixture
def test_user(db):
    """Create a test user in the database."""
    import bcrypt
    hashed = bcrypt.hashpw("testpassword123".encode(), bcrypt.gensalt()).decode()
    
    from models import User
    user = User(
        email="test@example.com",
        hashed_password=hashed,
        plan="free",
        is_verified=True,
        is_admin=False,
        target_backend_url="https://httpbin.org",
        waf_enabled=True,
        rate_limit_enabled=True,
        api_key="bk_test_key_12345",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Get authentication headers for a test user."""
    from auth import create_access_token
    token = create_access_token(data={"sub": str(test_user.id), "email": test_user.email})
    return {"Cookie": f"backport_access_token={token}"}
