# SmartFlood Standalone AI Backend

FastAPI service for AI-optimized relief recommendations. It reads sensors and
latest readings from MongoDB, reads family vulnerability records from Supabase,
returns generated plans as drafts, stores only approved recommendations in
Supabase, and records best-effort AI audit events.

## AI Architecture

SmartFlood uses a two-layer decision pipeline:

```text
INPUT
Sensor + demographic data
        |
AHP + Fuzzy Logic
        |
Priority Scores
        |
ILP Optimization
        |
Severity First
Vulnerability First
Balanced
        |
Exact Integer Allocations
        |
CSWDD Human-in-the-loop Approval
```

Layer 1, AHP + Fuzzy Logic, handles decision scoring. Fuzzy logic classifies the
latest water level into flood risk labels, and the AHP-inspired vulnerability
score preserves the seven dimensions already used by the backend: infant,
elderly, PWD, pregnant, lactating, toddler, and 4Ps. This layer produces the
priority coefficients used by optimization.

Layer 2, Integer Linear Programming, handles constrained allocation. It does not
claim to improve AI accuracy. It improves the mathematical allocation process by
finding an optimal integer allocation under the defined objective and
constraints.

## ILP Allocation

The ILP layer supports exactly these resource categories for each allocation
run:

- Family Food Packs
- Individual Relief Goods
- Emergency Kits

The existing API field names are still accepted:

- `family_food_packs`
- `relief_goods_individual`
- `medicine_kits`

The newer aliases are also accepted:

- `individual_relief_goods`
- `emergency_kits`

Decision variables are created per barangay and resource:

```text
x_food_i
x_goods_i
x_kit_i
```

All decision variables are non-negative integers. This is ILP rather than
ordinary continuous LP because relief units must be whole numbers; decimal
family food packs or emergency kits are not valid allocations.

For each resource category, the objective maximizes weighted allocation:

```text
maximize sum(priority_i * x_i)
```

The priority coefficient comes from the existing AHP + Fuzzy layer. The three
optimization profiles adjust the coefficient before solving:

- Severity First: greater weight on flood severity.
- Vulnerability First: greater weight on demographic vulnerability.
- Balanced: preserves the existing severity/vulnerability balance.

Each profile also applies a strategy coverage target before solving. This keeps
the three plans useful as review alternatives even when available inventory is
larger than current demand:

- Severity First: higher emergency-kit coverage, lower non-emergency coverage.
- Vulnerability First: higher food-pack and individual-goods coverage, lower
  emergency-kit coverage.
- Balanced: even coverage across all three resource categories.

Coverage targets never allow allocations to exceed available supply or demand
ceilings. They only decide how much of the defensible demand ceiling each
strategy should attempt to cover for review.

The constraints are:

- Supply: total allocation for each resource cannot exceed available supply.
- Non-negativity: every allocation is zero or greater.
- Integer units: every allocation is a whole number.
- Demand ceiling: allocation cannot exceed demand derived from existing family
  and demographic data.
- Equity floor: no existing equity floor rule was found in the backend, so no
  hard-coded minimum is added.

Demand ceilings use existing data only:

- Family food packs: affected family record count.
- Individual relief goods: total family members.
- Emergency kits: PWD + elderly + lactating + pregnant + infant counts.

If no demographic family data exists, the backend reports the missing demand
data instead of inventing allocations.

## Setup

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `GET /api/ai/recommendations`
- `POST /api/ai/recommendations/generate`
- `POST /api/ai/recommendations/approve`
- `GET /api/relief/inventory`
- `POST /api/relief/inventory`

`POST /api/ai/recommendations/generate` calculates and returns the three
strategy plans without writing allocation-history rows. The frontend displays
the plans for review. `POST /api/ai/recommendations/approve` accepts one plan's
`allocations` array and is the write path for allocation history. A declined
draft is not sent to the approval endpoint.

## Generate Recommendations

```bash
curl -X POST http://localhost:8000/api/ai/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "family_food_packs": 100,
    "emergency_kits": 50,
    "individual_relief_goods": 300,
    "audit_actor": {
      "actor_user_id": null,
      "actor_name": "City Admin",
      "actor_role": "City Admin"
    }
  }'
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "recommendation_id": null,
      "barangay_id": "1",
      "barangay_name": "Barangay Tanong",
      "risk_level": "severity",
      "priority_score": 405.78,
      "affected_families": 12,
      "recommended_family_food_packs": 12,
      "recommended_medicine_kits": 18,
      "recommended_emergency_kits": 18,
      "recommended_relief_goods_individual": 80,
      "analysis_reason": "Severity flood risk detected at 1.20m with 12 affected families. Relief allocation prioritized based on available inventory.",
      "ahp_breakdown": {
        "weights": {
          "infant": 0.22,
          "elderly": 0.2,
          "pwd": 0.18,
          "pregnant": 0.12,
          "lactating": 0.1,
          "toddler": 0.1,
          "four_ps": 0.08
        },
        "counts": {
          "infant": 4,
          "elderly": 8,
          "pwd": 5,
          "pregnant": 2,
          "lactating": 2,
          "toddler": 5,
          "four_ps": 18
        },
        "contributions": {
          "infant": 0.88,
          "elderly": 1.6,
          "pwd": 0.9,
          "pregnant": 0.24,
          "lactating": 0.2,
          "toddler": 0.5,
          "four_ps": 1.44
        },
        "total_vulnerability_score": 5.76
      },
      "fuzzy_explanation": {
        "water_level_m": 1.2,
        "risk_level": "severity",
        "risk_label": "Severity",
        "confidence": 1.0,
        "memberships": {
          "normal": 0.0,
          "flood_alert": 0.0,
          "flood_warning": 0.0,
          "severity": 1.0
        }
      },
      "reasoning_steps": [
        "Sensor reading classified the barangay as Severity risk.",
        "Family vulnerability score was computed using AHP-inspired weights.",
        "Available inventory was distributed based on priority and affected families."
      ],
      "status": "generated",
      "created_by": "City Admin",
      "created_at": "2026-05-31T12:00:00+00:00"
    }
  ],
  "plans": [
    {
      "plan_id": "severity_first",
      "plan_name": "Severity First",
      "objective_value": 12345.0,
      "available_supply": {
        "family_food_packs": 100,
        "individual_relief_goods": 300,
        "emergency_kits": 50
      },
      "allocations": [
        {
          "barangay_id": "1",
          "barangay_name": "Barangay Tanong",
          "priority_score": 605.76,
          "recommended_family_food_packs": 12,
          "recommended_individual_relief_goods": 80,
          "recommended_emergency_kits": 18,
          "demand_ceiling": {
            "recommended_family_food_packs": 12,
            "recommended_relief_goods_individual": 80,
            "recommended_emergency_kits": 18
          },
          "constraints_satisfied": true
        }
      ]
    }
  ]
}
```

## Tests

```bash
python3 -m compileall -q app tests
python3 -m unittest discover -s tests -v
```
