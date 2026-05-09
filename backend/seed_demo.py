"""
Backport Demo Instance Setup Guide
===================================

This guide explains how to set up a demo instance at demo.backport.in
with pre-filled sample data and interactive WAF testing.

STEP 1: DNS Configuration
--------------------------
1. Go to your domain registrar (Cloudflare recommended)
2. Add a CNAME record:
   - Name: demo
   - Target: cname.vercel-dns.com (if using Vercel)
   - Or: A record pointing to your VPS IP
3. Wait for DNS propagation (usually 5-30 minutes)

STEP 2: Frontend (Vercel)
--------------------------
1. Create a new Vercel project from the Backport-io repo
2. Set the domain: demo.backport.in
3. Environment Variables:
   - NEXT_PUBLIC_BACKEND_URL=https://demo-api.backport.in
   - NEXT_PUBLIC_IS_DEMO=true

STEP 3: Backend (Render/Railway)
---------------------------------
1. Deploy the backend as a new web service
2. Set environment variables:
   - ENVIRONMENT=production
   - DATABASE_URL=<your postgres url>
   - SECRET_KEY=<strong random key>
   - ADMIN_EMAIL=suhail@backport.in
   - CORS_ORIGINS=["https://demo.backport.in"]
   - RESEND_API_KEY=<your key>
   - FROM_EMAIL=noreply@backport.in
3. Set custom domain: demo-api.backport.in

STEP 4: Seed Demo Data
-----------------------
After deployment, run this script to populate demo data:

    python seed_demo.py

This creates:
- Demo user account (demo@backport.in / demo1234)
- Pre-configured API keys
- Sample WAF rules
- Mock endpoints
- Sample analytics data
- Webhook configurations

STEP 5: Demo Features
----------------------
The demo instance should showcase:
1. Live WAF testing (try SQL injection, XSS, etc.)
2. Pre-configured dashboard with sample traffic data
3. Working API proxy (demo backend URL pre-set)
4. Sample transformation rules
5. Mock endpoint examples
"""

# DEMO SEED DATA
# Run this after deploying to populate the demo instance

import os
import sys
import json
import random
import string
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import User, TransformationRule, MockEndpoint, CustomWafRule, Webhook
import hashlib

def random_string(length=12):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_demo():
    """Seed the demo instance with sample data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create demo user
        demo_email = "demo@backport.in"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        
        if not demo_user:
            demo_user = User(
                email=demo_email,
                password_hash=hash_password("demo1234"),
                name="Demo User",
                plan="pro",
                plan_started_at=datetime.now(timezone.utc),
                plan_expires_at=datetime.now(timezone.utc) + timedelta(days=365),
                plan_source="demo",
                is_verified=True,
                is_admin=False,
                is_active=True,
                is_banned=False,
                target_url="https://jsonplaceholder.typicode.com",
                waf_enabled=True,
                rate_limit_enabled=True,
                caching_enabled=True,
                idempotency_enabled=True,
            )
            db.add(demo_user)
            db.flush()
            print("✅ Demo user created: demo@backport.in / demo1234")
        else:
            print("ℹ️  Demo user already exists")
        
        # 2. Create API keys for demo user
        from models import ApiKey
        existing_keys = db.query(ApiKey).filter(ApiKey.user_id == demo_user.id).count()
        
        if existing_keys == 0:
            demo_keys = [
                ApiKey(user_id=demo_user.id, name="Demo Key", key=f"bk_live_{random_string(24)}", is_active=True),
                ApiKey(user_id=demo_user.id, name="Testing Key", key=f"bk_test_{random_string(24)}", is_active=True),
                ApiKey(user_id=demo_user.id, name="Staging Key", key=f"bk_staging_{random_string(24)}", is_active=True),
            ]
            db.add_all(demo_keys)
            print(f"✅ Created {len(demo_keys)} demo API keys")
        
        # 3. Create transformation rules
        existing_transforms = db.query(TransformationRule).filter(TransformationRule.user_id == demo_user.id).count()
        
        if existing_transforms == 0:
            transforms = [
                TransformationRule(
                    user_id=demo_user.id,
                    name="Remove internal fields",
                    path_pattern="/api/users/*",
                    action="remove_fields",
                    config=json.dumps({"fields": ["password_hash", "internal_notes", "salary"]}),
                    is_active=True,
                ),
                TransformationRule(
                    user_id=demo_user.id,
                    name="Add metadata wrapper",
                    path_pattern="/api/*",
                    action="wrap_response",
                    config=json.dumps({"wrapper_key": "data", "add_timestamp": True, "add_status": True}),
                    is_active=True,
                ),
                TransformationRule(
                    user_id=demo_user.id,
                    name="Rename user fields",
                    path_pattern="/api/users/*",
                    action="rename_keys",
                    config=json.dumps({"mappings": {"usr_id": "id", "usr_email": "email", "usr_name": "name"}}),
                    is_active=False,
                ),
            ]
            db.add_all(transforms)
            print(f"✅ Created {len(transforms)} transformation rules")
        
        # 4. Create mock endpoints
        existing_mocks = db.query(MockEndpoint).filter(MockEndpoint.user_id == demo_user.id).count()
        
        if existing_mocks == 0:
            mocks = [
                MockEndpoint(
                    user_id=demo_user.id,
                    name="Mock Users List",
                    path="/mock/users",
                    method="GET",
                    status_code=200,
                    response_body=json.dumps([
                        {"id": 1, "name": "Alice Johnson", "role": "admin", "email": "alice@example.com"},
                        {"id": 2, "name": "Bob Smith", "role": "user", "email": "bob@example.com"},
                        {"id": 3, "name": "Charlie Brown", "role": "user", "email": "charlie@example.com"},
                    ]),
                    headers=json.dumps({"X-Mock": "true", "Cache-Control": "no-store"}),
                    is_active=True,
                ),
                MockEndpoint(
                    user_id=demo_user.id,
                    name="Mock Payment Response",
                    path="/mock/payment",
                    method="POST",
                    status_code=200,
                    response_body=json.dumps({
                        "transaction_id": f"txn_{random_string(16)}",
                        "status": "success",
                        "amount": 99.99,
                        "currency": "USD",
                        "message": "Payment processed successfully"
                    }),
                    headers=json.dumps({"X-Mock": "true"}),
                    is_active=True,
                ),
                MockEndpoint(
                    user_id=demo_user.id,
                    name="Mock Error Response",
                    path="/mock/error",
                    method="GET",
                    status_code=500,
                    response_body=json.dumps({"error": "Internal Server Error", "code": "SERVER_ERROR"}),
                    headers=json.dumps({}),
                    is_active=True,
                ),
            ]
            db.add_all(mocks)
            print(f"✅ Created {len(mocks)} mock endpoints")
        
        # 5. Create custom WAF rules
        existing_waf = db.query(CustomWafRule).filter(CustomWafRule.user_id == demo_user.id).count()
        
        if existing_waf == 0:
            waf_rules = [
                CustomWafRule(
                    user_id=demo_user.id,
                    name="Block admin path access",
                    pattern=r"/admin|/wp-admin|/phpmyadmin",
                    severity="high",
                    is_active=True,
                ),
                CustomWafRule(
                    user_id=demo_user.id,
                    name="Block user enumeration",
                    pattern=r"/api/users\?id=\d+.*(OR|AND|UNION|SELECT)",
                    severity="critical",
                    is_active=True,
                ),
                CustomWafRule(
                    user_id=demo_user.id,
                    name="Rate limit suspicious IPs",
                    pattern=r"(?:load_test|benchmark|stress_test)",
                    severity="medium",
                    is_active=False,
                ),
            ]
            db.add_all(waf_rules)
            print(f"✅ Created {len(waf_rules)} custom WAF rules")
        
        # 6. Create webhook configurations
        existing_webhooks = db.query(Webhook).filter(Webhook.user_id == demo_user.id).count()
        
        if existing_webhooks == 0:
            webhooks = [
                Webhook(
                    user_id=demo_user.id,
                    name="Slack - Security Alerts",
                    url="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
                    events=json.dumps(["waf_blocked", "rate_limit_exceeded", "unauthorized_access"]),
                    is_active=True,
                ),
                Webhook(
                    user_id=demo_user.id,
                    name="Discord - All Events",
                    url="https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK",
                    events=json.dumps(["waf_blocked", "rate_limit_exceeded", "backend_error", "api_key_created"]),
                    is_active=False,
                ),
            ]
            db.add_all(webhooks)
            print(f"✅ Created {len(webhooks)} webhook configurations")
        
        db.commit()
        print("\n🎉 Demo instance seeded successfully!")
        print("   Login: demo@backport.in / demo1234")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding demo: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Backport demo instance...\n")
    seed_demo()
