# Malabon-SmartFlood-Frontend

Next.js App Router frontend for the SmartFlood dashboard.

## AI Relief Recommendation Flow

The AI relief recommendation page uses the backend as the source of truth for
AHP, fuzzy classification, priority scoring, ILP allocation, demand ceilings,
and reasoning data.

User flow:

```text
Generate Recommendation
        |
Choose Severity First, Vulnerability First, or Balanced
        |
Review barangay allocations for the selected strategy
        |
Open View Analysis for AHP, fuzzy, ILP, constraints, and reasoning details
        |
Accept Strategy -> save the selected plan to allocation history
Decline -> discard the draft and generate again
```

Generating and selecting a strategy creates a reviewable draft only. Allocation
history is updated only after the user clicks Accept Strategy. Declining clears
the draft without saving it and returns the Generate Recommendation action.
