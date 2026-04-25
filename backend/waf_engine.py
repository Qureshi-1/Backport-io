"""
Modular WAF rules engine with built-in and custom rule support.

Features:
    - Built-in rules loaded from proxy.py's WAF_PATTERNS.
    - Custom rules with pattern, action (BLOCK/LOG/ALLOW), severity, category.
    - Add/remove/toggle custom rules.
    - Caches compiled regex patterns for performance.
    - Category-based rule grouping (SQL_INJECTION, XSS, PATH_TRAVERSAL, etc.).

Usage:
    from waf_engine import waf_engine
    result = waf_engine.check(body="<script>alert(1)</script>", path="/api", query="")
    # => {"blocked": True, "matched_rules": [...], "action": "BLOCK"}
"""

import re
import time
import threading
import logging
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# ─── WAF Categories ─────────────────────────────────────────────────────────

class WAFCategories(str, Enum):
    """Supported WAF rule categories."""
    SQL_INJECTION = "SQL_INJECTION"
    XSS = "XSS"
    PATH_TRAVERSAL = "PATH_TRAVERSAL"
    COMMAND_INJECTION = "COMMAND_INJECTION"
    LDAP_INJECTION = "LDAP_INJECTION"
    XXE = "XXE"
    CUSTOM = "CUSTOM"


# ─── Rule Actions ───────────────────────────────────────────────────────────

class WAFAction(str, Enum):
    """Actions that can be taken when a rule matches."""
    BLOCK = "BLOCK"
    LOG = "LOG"
    ALLOW = "ALLOW"


# ─── Custom Rule ────────────────────────────────────────────────────────────

@dataclass
class CustomRule:
    """A user-defined WAF rule.

    Attributes:
        name: Human-readable rule name.
        pattern: Regular expression pattern to match against request data.
        action: What to do when the rule matches (BLOCK, LOG, ALLOW).
        enabled: Whether the rule is active.
        severity: Severity level (low, medium, high, critical).
        category: Rule category for grouping.
        description: Optional description of the rule.
        rule_id: Optional unique identifier (auto-generated if not provided).
        created_at: When the rule was created.
        hit_count: Number of times this rule has matched.
    """
    name: str
    pattern: str
    action: str = "BLOCK"
    enabled: bool = True
    severity: str = "medium"
    category: str = "CUSTOM"
    description: str = ""
    rule_id: Optional[int] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    hit_count: int = 0

    def __post_init__(self):
        if self.rule_id is None:
            self.rule_id = id(self) % (2**31)

    def to_dict(self) -> dict:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "pattern": self.pattern,
            "action": self.action,
            "enabled": self.enabled,
            "severity": self.severity,
            "category": self.category,
            "description": self.description,
            "created_at": self.created_at,
            "hit_count": self.hit_count,
        }


# ─── Compiled Rule (internal) ───────────────────────────────────────────────

class _CompiledRule:
    """Internal representation of a compiled WAF rule."""

    __slots__ = ("pattern", "compiled", "name", "action", "category", "severity",
                 "enabled", "source", "rule_id", "hit_count")

    def __init__(self, pattern: str, compiled: re.Pattern, name: str,
                 action: str, category: str, severity: str,
                 enabled: bool, source: str, rule_id: Optional[int] = None):
        self.pattern = pattern
        self.compiled = compiled
        self.name = name
        self.action = action
        self.category = category
        self.severity = severity
        self.enabled = enabled
        self.source = source  # "builtin" or "custom"
        self.rule_id = rule_id
        self.hit_count = 0


# ─── Built-in Rule Definitions ──────────────────────────────────────────────

# Maps built-in patterns from proxy.py to categories and names
_BUILTIN_RULE_DEFS: list[tuple[str, str, str, str, str]] = [
    # (pattern_regex, name, action, category, severity)
    # SQL Injection
    (r"(\b(union\s+(all\s+)?select|insert\s+into|update\s+.*\bset\b|delete\s+from|drop\s+(table|database|column)|alter\s+table|create\s+table|truncate\s+table)\b)",
     "Union-based SQL Injection", "BLOCK", "SQL_INJECTION", "critical"),
    (r"(\b(select\s+.*\bfrom\b|exec\s*\(|execute\s*\(|xp_cmdshell|sp_executesql)\b)",
     "SQL Query Injection", "BLOCK", "SQL_INJECTION", "critical"),
    (r"(--|#|/\*.*\*/|;\s*(drop|alter|create|truncate|delete|update|insert))",
     "SQL Comment Injection", "BLOCK", "SQL_INJECTION", "high"),
    (r"('\s*(or|and)\s+[\d'\"=]+)",
     "SQL Boolean Injection", "BLOCK", "SQL_INJECTION", "high"),
    (r"(\b(1\s*=\s*1|1\s*=\s*'1'|'1'\s*=\s*'1')\b)",
     "SQL Tautology", "BLOCK", "SQL_INJECTION", "medium"),

    # XSS
    (r"(<\s*script[^>]*>|<\s*/\s*script\s*>)",
     "Script Tag Injection", "BLOCK", "XSS", "critical"),
    (r"(on(error|load|click|mouseover|focus|blur|submit|change|input|keyup|keydown)\s*=)",
     "Event Handler Injection", "BLOCK", "XSS", "high"),
    (r"(javascript\s*:|vbscript\s*:|data\s*:text/html)",
     "Protocol Injection", "BLOCK", "XSS", "high"),
    (r"(<\s*(iframe|object|embed|form|img\s+[^>]*onerror)[^>]*>)",
     "HTML Tag Injection", "BLOCK", "XSS", "medium"),

    # Path Traversal
    (r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.%2e/|%2e\./|..%2f)",
     "Directory Traversal", "BLOCK", "PATH_TRAVERSAL", "high"),
    (r"(/etc/(passwd|shadow|hosts)|/proc/self/|/dev/null)",
     "Sensitive File Access", "BLOCK", "PATH_TRAVERSAL", "critical"),

    # Command Injection
    (r"(;\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|ruby|nc|netcat)\b)",
     "Command Injection (Semicolon)", "BLOCK", "COMMAND_INJECTION", "critical"),
    (r"(\|\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|ruby|nc)\b)",
     "Command Injection (Pipe)", "BLOCK", "COMMAND_INJECTION", "critical"),
    (r"(`[^`]*`|\$\([^)]*\))",
     "Command Substitution", "BLOCK", "COMMAND_INJECTION", "high"),

    # LDAP Injection
    (r"([)(|*\\].*=.*[)(|*\\])",
     "LDAP Injection", "BLOCK", "LDAP_INJECTION", "high"),

    # XXE
    (r"(<!DOCTYPE[^>]*\bSYSTEM\b|<!ENTITY)",
     "XML External Entity", "BLOCK", "XXE", "critical"),
]


# ─── Modular WAF Engine ─────────────────────────────────────────────────────

class ModularWAF:
    """
    Modular WAF engine that merges built-in rules with custom user rules.

    The engine maintains separate lists for built-in and custom rules,
    caches compiled regex patterns, and supports add/remove/toggle operations.
    """

    def __init__(self):
        self._custom_rules: dict[int, CustomRule] = {}  # rule_id -> CustomRule
        self._compiled_cache: dict[int, _CompiledRule] = {}
        self._lock = threading.Lock()
        self._next_rule_id = 1_000_000  # Custom rules start at 1M to avoid collision

        # Load built-in rules
        self._load_builtin_rules()

    def _load_builtin_rules(self) -> None:
        """Load built-in WAF rules from the predefined patterns."""
        with self._lock:
            for pattern_str, name, action, category, severity in _BUILTIN_RULE_DEFS:
                try:
                    compiled = re.compile(pattern_str, re.IGNORECASE)
                    rule = _CompiledRule(
                        pattern=pattern_str,
                        compiled=compiled,
                        name=name,
                        action=action,
                        category=category,
                        severity=severity,
                        enabled=True,
                        source="builtin",
                    )
                    # Use the pattern hash as a stable ID for built-in rules
                    rule.rule_id = hash(pattern_str) % (2**31)
                    self._compiled_cache[rule.rule_id] = rule
                except re.error as e:
                    logger.warning(f"Failed to compile built-in WAF rule '{name}': {e}")

    def _compile_custom_rule(self, custom_rule: CustomRule) -> Optional[_CompiledRule]:
        """Compile a custom rule and add it to the cache."""
        try:
            compiled = re.compile(custom_rule.pattern, re.IGNORECASE)
            return _CompiledRule(
                pattern=custom_rule.pattern,
                compiled=compiled,
                name=custom_rule.name,
                action=custom_rule.action,
                category=custom_rule.category,
                severity=custom_rule.severity,
                enabled=custom_rule.enabled,
                source="custom",
                rule_id=custom_rule.rule_id,
            )
        except re.error as e:
            logger.warning(f"Failed to compile custom WAF rule '{custom_rule.name}': {e}")
            return None

    def add_rule(self, name: str, pattern: str, action: str = "BLOCK",
                 severity: str = "medium", category: str = "CUSTOM",
                 description: str = "", enabled: bool = True) -> CustomRule:
        """
        Add a custom WAF rule.

        Returns the created CustomRule object.
        Raises ValueError if the pattern is not a valid regex.
        """
        # Validate pattern compiles
        try:
            re.compile(pattern, re.IGNORECASE)
        except re.error as e:
            raise ValueError(f"Invalid regex pattern: {e}")

        with self._lock:
            rule_id = self._next_rule_id
            self._next_rule_id += 1

            rule = CustomRule(
                name=name,
                pattern=pattern,
                action=action,
                severity=severity,
                category=category,
                description=description,
                enabled=enabled,
                rule_id=rule_id,
            )
            self._custom_rules[rule_id] = rule

            # Compile and cache
            compiled = self._compile_custom_rule(rule)
            if compiled:
                self._compiled_cache[rule_id] = compiled

        return rule

    def remove_rule(self, rule_id: int) -> bool:
        """Remove a custom rule by ID. Returns True if the rule was found and removed."""
        with self._lock:
            if rule_id in self._custom_rules:
                del self._custom_rules[rule_id]
                self._compiled_cache.pop(rule_id, None)
                return True
        return False

    def toggle_rule(self, rule_id: int, enabled: Optional[bool] = None) -> bool:
        """
        Toggle a custom rule's enabled state.

        If *enabled* is not provided, the rule is toggled (flipped).
        Returns True if the rule was found.
        """
        with self._lock:
            if rule_id in self._custom_rules:
                rule = self._custom_rules[rule_id]
                if enabled is None:
                    rule.enabled = not rule.enabled
                else:
                    rule.enabled = enabled

                # Update compiled cache
                compiled = self._compiled_cache.get(rule_id)
                if compiled:
                    compiled.enabled = rule.enabled
                return True
        return False

    def get_custom_rules(self) -> list[dict]:
        """Return all custom rules as dicts."""
        with self._lock:
            return [rule.to_dict() for rule in self._custom_rules.values()]

    def get_builtin_rules(self) -> list[dict]:
        """Return all built-in rules as dicts."""
        with self._lock:
            result = []
            for compiled in self._compiled_cache.values():
                if compiled.source == "builtin":
                    result.append({
                        "rule_id": compiled.rule_id,
                        "name": compiled.name,
                        "pattern": compiled.pattern,
                        "action": compiled.action,
                        "category": compiled.category,
                        "severity": compiled.severity,
                        "enabled": compiled.enabled,
                        "source": "builtin",
                        "hit_count": compiled.hit_count,
                    })
            return result

    def get_all_rules(self) -> list[dict]:
        """Return both built-in and custom rules."""
        return self.get_builtin_rules() + self.get_custom_rules()

    def check(self, body: str, path: str, query: str) -> dict:
        """
        Check request data against all enabled WAF rules.

        Args:
            body: Request body string.
            path: Request path string.
            query: Query string.

        Returns:
            dict with keys:
                - ``blocked`` (bool): Whether the request should be blocked.
                - ``matched_rules`` (list): List of matched rule info dicts.
                - ``action`` (str): The most severe action taken (BLOCK, LOG, ALLOW).
        """
        combined = f"{body} {path} {query}"
        matched_rules = []
        should_block = False
        most_severe_action = "LOG"  # Default action

        # Severity ranking for determining most severe action
        action_rank = {"ALLOW": 0, "LOG": 1, "BLOCK": 2}

        with self._lock:
            rules_snapshot = list(self._compiled_cache.values())

        for rule in rules_snapshot:
            if not rule.enabled:
                continue

            try:
                if rule.compiled.search(combined):
                    rule.hit_count += 1
                    matched_rules.append({
                        "rule_id": rule.rule_id,
                        "name": rule.name,
                        "pattern": rule.pattern,
                        "action": rule.action,
                        "category": rule.category,
                        "severity": rule.severity,
                        "source": rule.source,
                    })

                    if rule.action == "BLOCK":
                        should_block = True
                    if action_rank.get(rule.action, 0) > action_rank.get(most_severe_action, 0):
                        most_severe_action = rule.action
            except Exception as e:
                logger.warning(f"WAF rule '{rule.name}' match error: {e}")
                continue

        return {
            "blocked": should_block,
            "matched_rules": matched_rules,
            "action": most_severe_action,
        }


# ─── Global Singleton ───────────────────────────────────────────────────────

waf_engine = ModularWAF()
