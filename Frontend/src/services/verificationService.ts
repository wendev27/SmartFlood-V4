import type { ApplicationFormValues } from "@/types/verification";
import { fetchJson } from "@/services/apiClient";

export async function getVerificationApplications() {
  return fetchJson<Record<string, unknown>[]>("/api/resident-applications");
}

export async function getApplicationFormDefaults() {
  return Promise.resolve<ApplicationFormValues>({
    surname: "",
    firstName: "",
    middleName: "",
    contactNumber: "",
    ageSex: "",
    occupation: "",
    completeAddress: "",
    barangay: "",
    totalFamilyMembers: "",
    householdHead: "",
    specialNeeds: "",
    medicalConditions: "",
  });
}
