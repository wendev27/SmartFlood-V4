from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)


def sanitize_audit_event(event: dict[str, Any]) -> dict[str, Any]:
    sanitized = dict(event)
    actor_user_id = sanitized.get("actor_user_id")
    try:
        sanitized["actor_user_id"] = str(UUID(str(actor_user_id))) if actor_user_id else None
    except (TypeError, ValueError, AttributeError):
        sanitized["actor_user_id"] = None
    return sanitized


def log_audit_event_safely(log_event: Callable[[dict[str, Any]], None], event: dict[str, Any]) -> None:
    try:
        log_event(event)
    except Exception:
        logger.exception("Audit log insert failed")
