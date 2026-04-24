import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Priority:
#   1. DATABASE_URL (if set — supports PostgreSQL or SQLite)
#   2. DB_PATH (if set — used by Render Blueprint persistent disk)
#   3. Default: SQLite in current directory
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    db_path = os.getenv("DB_PATH", "")
    if db_path:
        # Ensure the directory exists (for Render persistent disk)
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        DATABASE_URL = f"sqlite:///{db_path}"
    else:
        DATABASE_URL = "sqlite:///./backport.db"

# Fix for Render PostgreSQL URL (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif DATABASE_URL.startswith("postgresql"):
    # Supabase/Neon require SSL
    connect_args = {
        "sslmode": "require",
    }

# Pool settings — only for PostgreSQL (SQLite has its own built-in pooling)
pool_kwargs = {}
if DATABASE_URL.startswith("postgresql"):
    # Optimized pool settings for free tier (512MB RAM on Render)
    pool_kwargs = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 30,
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    **pool_kwargs,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

print(f"Database URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
