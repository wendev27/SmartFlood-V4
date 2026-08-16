from __future__ import annotations

import unittest

from app.payloads import recommendation_rows_to_save, to_int
from app.models import InventoryInput


class RecommendationPayloadTests(unittest.TestCase):
    def test_to_int_accepts_decimal_strings(self) -> None:
        self.assertEqual(to_int("34.0"), 34)
        self.assertEqual(to_int("20.0"), 20)
        self.assertEqual(to_int(None), 0)

    def test_supabase_rows_use_real_integers_for_integer_columns(self) -> None:
        rows = recommendation_rows_to_save(
            [
                {
                    "barangay_id": "1.0",
                    "barangay_name": "Barangay Tanong",
                    "risk_level": "severity",
                    "priority_score": 405.78,
                    "affected_families": "12.0",
                    "recommended_family_food_packs": "34.0",
                    "recommended_medicine_kits": 20.0,
                    "recommended_relief_goods_individual": "80",
                    "analysis_reason": "Severity flood risk detected.",
                }
            ]
        )

        row = rows[0]
        self.assertEqual(row["priority_score"], 405.78)
        for field in (
            "barangay_id",
            "affected_families",
            "recommended_family_food_packs",
            "recommended_medicine_kits",
            "recommended_relief_goods_individual",
        ):
            self.assertIsInstance(row[field], int)

    def test_invalid_optional_barangay_id_is_saved_as_null(self) -> None:
        row = recommendation_rows_to_save([{"barangay_id": "unknown"}])[0]

        self.assertIsNone(row["barangay_id"])

    def test_inventory_input_accepts_ilp_category_aliases(self) -> None:
        inventory = InventoryInput.model_validate(
            {
                "family_food_packs": 100,
                "individual_relief_goods": 300,
                "emergency_kits": 50,
            }
        )

        self.assertEqual(inventory.inventory_payload()["family_food_packs"], 100)
        self.assertEqual(inventory.inventory_payload()["relief_goods_individual"], 300)
        self.assertEqual(inventory.inventory_payload()["medicine_kits"], 50)


if __name__ == "__main__":
    unittest.main()
