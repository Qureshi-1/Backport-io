from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timezone
import json as _json
import secrets
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Deprecated: api_key is now handled by ApiKey model
    api_key = Column(String, unique=True, index=True, nullable=True) 
    plan = Column(String, default="free")
    plan_started_at = Column(DateTime, nullable=True)  # When current plan was activated
    plan_expires_at = Column(DateTime, nullable=True)   # When current plan expires
    plan_payment_id = Column(String, nullable=True)      # Razorpay payment ID for tracking
    plan_source = Column(String, default="none")        # "none", "payment", "admin", "trial"
    target_backend_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)   # Email verified
    email_verification_token = Column(String, nullable=True)  # One-time token
    email_verification_sent_at = Column(DateTime, nullable=True)  # Rate limit resends
    
    password_reset_token = Column(String, nullable=True)
    password_reset_sent_at = Column(DateTime, nullable=True)
    
    rate_limit_enabled = Column(Boolean, default=True)
    caching_enabled = Column(Boolean, default=False)
    idempotency_enabled = Column(Boolean, default=True)
    waf_enabled = Column(Boolean, default=False)
    
    # OAuth Social Login
    oauth_provider = Column(String, nullable=True)  # "google" or "github"
    oauth_id = Column(String, nullable=True)  # Provider's unique user ID
    name = Column(String, nullable=True)  # Display name from OAuth
    avatar_url = Column(String, nullable=True)  # Profile picture URL
    
    # Team context
    current_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)

    feedbacks = relationship("Feedback", back_populates="user")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, default="Default Gateway")
    key = Column(String, unique=True, index=True, nullable=False, default=lambda: "bk_" + secrets.token_urlsafe(16))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="api_keys")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, default="general")
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_email = Column(String, nullable=False)
    user = relationship("User", back_populates="feedbacks")

class ApiLog(Base):
    __tablename__ = "api_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True, index=True)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    was_cached = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Enhanced logging fields (GhostAPI merge)
    ip_address = Column(String, nullable=True)
    request_headers = Column(Text, nullable=True)  # JSON string
    request_body = Column(Text, nullable=True)
    response_size = Column(Integer, default=0)
    query_params = Column(String, nullable=True)
    response_body = Column(Text, nullable=True)
    
    user = relationship("User")
    api_key = relationship("ApiKey")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    owner = relationship("User", foreign_keys=[owner_id])


class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # "owner", "admin", "member", "viewer"
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")
    __table_args__ = (UniqueConstraint('team_id', 'user_id', name='uq_team_member'),)


class EndpointConfig(Base):
    __tablename__ = "endpoint_configs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    path_pattern = Column(String, nullable=False)  # e.g. "/api/users/*"
    max_rpm = Column(Integer, default=100)
    burst_size = Column(Integer, default=10)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(String, nullable=False)  # rate_limit_abuse, waf_spike, error_spike, slow_endpoint
    message = Column(Text, nullable=False)
    severity = Column(String, default="warning")  # warning, medium, high, critical
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(Text, default="{}")  # JSON string
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")


class HealthCheck(Base):
    __tablename__ = "health_checks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)  # "up", "down", "timeout"
    response_time_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    user = relationship("User")


class ApiEndpoint(Base):
    __tablename__ = "api_endpoints"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    request_headers = Column(Text, default="[]")  # JSON array of observed headers
    request_body_example = Column(Text, nullable=True)  # Sample request body
    response_body_example = Column(Text, nullable=True)  # Sample response body
    avg_latency_ms = Column(Integer, default=0)
    total_requests = Column(Integer, default=0)
    success_rate = Column(Integer, default=100)  # Store as integer percentage
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_starred = Column(Boolean, default=False)
    user = relationship("User")

class Integration(Base):
    __tablename__ = "integrations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "slack" or "discord"
    name = Column(String, default="")  # Custom name for the integration
    webhook_url = Column(String, nullable=False)  # Webhook URL
    events = Column(Text, default="[]")  # JSON array of event types to send
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_triggered_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    user = relationship("User")


def create_audit_log(db: Session, user_id=None, email=None, event_type="", details=None, ip_address=None):
    """Create an audit log entry. details should be a dict — will be JSON-serialized."""
    log = AuditLog(
        user_id=user_id,
        email=email,
        event_type=event_type,
        details=_json.dumps(details) if isinstance(details, dict) else details,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String, nullable=True)
    event_type = Column(String, nullable=False, index=True)  # login, signup, plan_purchase, plan_upgrade, plan_cancel, plan_expire, api_key_created, api_key_deleted, admin_action, profile_update
    details = Column(Text, nullable=True)  # JSON string with extra info
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
