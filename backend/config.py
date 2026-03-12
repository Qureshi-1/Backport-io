import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backport.db")
SECRET_KEY = os.getenv("SECRET_KEY", "backport-secret-key-change-this")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://backpack-io.vercel.app")
CORS_ORIGINS_STR = os.getenv("CORS_ORIGINS", f"{FRONTEND_URL},http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_STR.split(",") if o.strip()]

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@backport.dev")
PORT = int(os.getenv("PORT", 8080))
