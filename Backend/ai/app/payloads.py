from __future__ import annotations

from typing import Any


def to_int(value: Any, default: int = 0) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def recommendation_rows_to_save(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "barangay_id": _optional_int(row.get("barangay_id")),
            "barangay_name": row.get("barangay_name"),
            "risk_level": row.get("risk_level"),
            "priority_score": row.get("priority_score", 0),
            "affected_families": to_int(row.get("affected_families")),
            "recommended_family_food_packs": to_int(row.get("recommended_family_food_packs")),
            "recommended_medicine_kits": to_int(row.get("recommended_medicine_kits")),
            "recommended_relief_goods_individual": to_int(row.get("recommended_relief_goods_individual")),
            "analysis_reason": row.get("analysis_reason"),
        }
        for row in rows
    ]


def _optional_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None
