"""
Shared test helpers for creating authenticated users without rate limit issues.
Avoids using signup endpoint (which has IP-based rate limiting).
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def create_user_and_get_headers(db_engine, email=None, is_admin=False):
    """Create a user directly in DB and return (user_id, auth_headers).
    
    Args:
        db_engine: SQLAlchemy engine (from the engine fixture or database.engine)
        email: Optional email. If None, generates a unique one.
        is_admin: Whether to make the user an admin.
    
    Returns:
        Tuple of (user_id, headers_dict)
    """
    import secrets
    import bcrypt
    from sqlalchemy.orm import sessionmaker
    from models import User, ApiKey
    from auth import create_access_token

    if email is None:
        email = f"test_{secrets.token_hex(6)}@example.com"

    Session = sessionmaker(bind=db_engine)
    session = Session()

    # Check if user already exists (idempotent)
    user = session.query(User).filter(User.email == email).first()
    if not user:
        hashed = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
        user = User(
            email=email,
            hashed_password=hashed,
            plan="free",
            is_verified=True,
            is_admin=is_admin,
            target_backend_url="https://httpbin.org",
            waf_enabled=True,
            rate_limit_enabled=True,
            api_key=secrets.token_urlsafe(16),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Create default API key
        api_key = ApiKey(user_id=user.id, name="Default Gateway")
        session.add(api_key)
        session.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    session.close()

    return user.id, {"Authorization": f"Bearer {token}"}


def create_user_for_client(client, email=None, is_admin=False):
    """Create a user using the shared DB engine and return auth headers.
    
    Uses database.engine which is the same engine used by the TestClient.
    This avoids signup rate limiting issues.
    """
    from database import SessionLocal
    from sqlalchemy.orm import sessionmaker
    import secrets
    import bcrypt
    from models import User, ApiKey
    from auth import create_access_token

    if email is None:
        email = f"test_{secrets.token_hex(6)}@example.com"

    session = SessionLocal()
    
    user = session.query(User).filter(User.email == email).first()
    if not user:
        hashed = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
        user = User(
            email=email,
            hashed_password=hashed,
            plan="free",
            is_verified=True,
            is_admin=is_admin,
            target_backend_url="https://httpbin.org",
            waf_enabled=True,
            rate_limit_enabled=True,
            api_key=secrets.token_urlsafe(16),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        api_key = ApiKey(user_id=user.id, name="Default Gateway")
        session.add(api_key)
        session.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    session.close()

    return {"Authorization": f"Bearer {token}"}, email
