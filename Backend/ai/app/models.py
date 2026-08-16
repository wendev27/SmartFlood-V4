from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AuditActor(BaseModel):
    actor_user_id: str | None = None
    actor_name: str | None = None
    actor_role: str | None = None
    barangay_id: int | None = None
    barangay_name: str | None = None


class InventoryInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    family_food_packs: int = Field(default=0, ge=0)
    medicine_kits: int = Field(default=0, ge=0)
    relief_goods_individual: int = Field(default=0, ge=0)
    emergency_kits: int | None = Field(default=None, ge=0)
    individual_relief_goods: int | None = Field(default=None, ge=0)
    available_family_food_packs: int | None = Field(default=None, ge=0)
    available_medicine_kits: int | None = Field(default=None, ge=0)
    available_relief_goods_individual: int | None = Field(default=None, ge=0)
    available_emergency_kits: int | None = Field(default=None, ge=0)
    available_individual_relief_goods: int | None = Field(default=None, ge=0)
    updated_by: str | None = None
    audit_actor: AuditActor | None = None

    @model_validator(mode="before")
    @classmethod
    def accept_available_inventory_aliases(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        values = dict(data)
        alias_pairs = {
            "emergency_kits": "medicine_kits",
            "available_emergency_kits": "medicine_kits",
            "individual_relief_goods": "relief_goods_individual",
            "available_individual_relief_goods": "relief_goods_individual",
        }
        for alias, field in alias_pairs.items():
            if field not in values and alias in values:
                values[field] = values[alias]
        for field in ("family_food_packs", "medicine_kits", "relief_goods_individual"):
            alias = f"available_{field}"
            if field not in values and alias in values:
                values[field] = values[alias]
        return values

    @property
    def total(self) -> int:
        return self.family_food_packs + self.medicine_kits + self.relief_goods_individual

    def inventory_payload(self) -> dict[str, int | str | None]:
        return {
            "family_food_packs": self.family_food_packs,
            "medicine_kits": self.medicine_kits,
            "relief_goods_individual": self.relief_goods_individual,
            "updated_by": self.updated_by,
        }


class ApiResponse(BaseModel):
    success: bool = True
    data: Any = None
    plans: Any = None
