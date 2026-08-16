import type {
  ReliefAllocationHistory,
  ReliefInventoryItem,
  ReliefRecommendation,
  ReliefSummary,
} from "@/types/relief";

export const reliefSummaryMock: ReliefSummary[] = [
  { label: "Priority Families", value: "48", caption: "Households flagged for first-wave relief distribution.", emphasis: true },
  { label: "Relief Packs", value: "126", caption: "Available packs ready for release after city approval." },
  { label: "AI Confidence", value: "87%", caption: "Recommendations are based on current flood telemetry." },
];

export const reliefRecommendationsMock: ReliefRecommendation[] = [
  {
    id: "1",
    barangay: "Barangay Tañong",
    riskLevel: "Severe",
    affectedFamilies: 1200,
    familyFoodPacks: 800,
    medicineKits: 50,
    reliefForIndividual: 1020,
    hasSensorReading: true,
    recommendedItems: "Family Food Packs (800), Medicine Kits (50), Relief Goods for Individual (1020)",
    analysisReason: "Flood level severity, 1,200 affected families",
    report:
      "Located in a low-lying area with frequent flooding during heavy rainfall. Barangay Tañong serves 1,200 families with a total population of 5,420. The barangay is home to 320 elderly residents, 85 persons with disabilities, and 450 4P's beneficiaries who receive livelihood support through 12 active programs. Healthcare services are provided by Tañong Health Center with 8 medical staff serving 23 active medical cases, maintaining a 87% vaccination rate and monitoring 38 maternal cases. As a flood-prone area, disaster preparedness includes 3 evacuation centers, 25 emergency responders, and 1,500 relief goods packs in stock, with the last incident recorded on 2026-04-10. Peace and order is maintained by 15 barangay tanods, with 45 total incidents recorded, 38 resolved and 7 pending cases as of the last incident on 2026-05-15.",
  },
  {
    id: "2",
    barangay: "Barangay Catmon",
    riskLevel: "Flood Warning",
    affectedFamilies: 600,
    familyFoodPacks: 400,
    medicineKits: 500,
    reliefForIndividual: 300,
    hasSensorReading: true,
    recommendedItems: "Family Food Packs (400), Medicine Kits (500), Relief Goods for Individual (300)",
    analysisReason: "Rising water levels, 600 affected families",
    report:
      "Barangay Catmon is under close monitoring because rising water levels are affecting access roads and residential clusters near the creek line. Current estimates show 600 affected families, with priority support needed for elderly residents, children, and residents with active medical needs. The recommendation prioritizes medicine kits for continuity of care while maintaining food packs and individual relief goods for immediate distribution.",
  },
  {
    id: "3",
    barangay: "Barangay Potrero",
    riskLevel: "Flood Warning",
    affectedFamilies: 450,
    familyFoodPacks: 500,
    medicineKits: 350,
    reliefForIndividual: 493,
    hasSensorReading: true,
    recommendedItems: "Family Food Packs (500), Medicine Kits (350), Relief Goods for Individual (493)",
    analysisReason: "Warning level alert, 450 affected families",
    report:
      "Barangay Potrero is currently at warning level, with 450 families requiring readiness support as conditions continue to shift. The area needs balanced relief preparation across food, medicine, and individual goods because several evacuation routes may become congested during heavier rainfall. Distribution should remain staged and ready for release if water levels worsen.",
  },
];

export const reliefInventoryMock: ReliefInventoryItem[] = [
  { id: "family-food-packs", name: "Family Food Packs", unit: "packs", quantity: 500 },
  { id: "medicine-kits", name: "Medicine Kits", unit: "kits", quantity: 300 },
  { id: "relief-goods-individual", name: "Relief Goods for Individual", unit: "packs", quantity: 1000 },
];

export const reliefAllocationHistoryMock: ReliefAllocationHistory[] = [
  {
    id: "001",
    date: "2026-05-08",
    time: "09 : 30 AM",
    barangay: "Barangay Tañong",
    familyFoodPacks: 800,
    medicineKits: 50,
    reliefForIndividual: 1020,
  },
  {
    id: "001",
    date: "2026-05-07",
    time: "12 : 00 PM",
    barangay: "Barangay Potrero",
    familyFoodPacks: 500,
    medicineKits: 350,
    reliefForIndividual: 493,
  },
  {
    id: "001",
    date: "2026-05-09",
    time: "03 : 04 PM",
    barangay: "Barangay Catmon",
    familyFoodPacks: 400,
    medicineKits: 500,
    reliefForIndividual: 300,
  },
];
