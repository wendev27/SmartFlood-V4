from __future__ import annotations

import unittest

from app.audit import log_audit_event_safely, sanitize_audit_event


class AuditLoggingTests(unittest.TestCase):
    def test_invalid_actor_user_id_is_saved_as_null(self) -> None:
        event = sanitize_audit_event({"actor_user_id": "not-a-uuid", "action": "TEST"})

        self.assertIsNone(event["actor_user_id"])

    def test_valid_actor_user_id_is_preserved(self) -> None:
        actor_user_id = "a8d61b2e-c85d-4d91-bd58-5719ea6ecabc"

        event = sanitize_audit_event({"actor_user_id": actor_user_id})

        self.assertEqual(event["actor_user_id"], actor_user_id)

    def test_logging_failure_does_not_escape(self) -> None:
        def failing_logger(_event: dict[str, object]) -> None:
            raise RuntimeError("database unavailable")

        with self.assertLogs("app.audit", level="ERROR"):
            log_audit_event_safely(failing_logger, {"actor_user_id": None})


if __name__ == "__main__":
    unittest.main()
