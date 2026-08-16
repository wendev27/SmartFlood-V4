export type VerificationStatus = "pending" | "approved" | "rejected";
export type ModalMode = "add" | "edit";

export interface VerificationApplication {
  application_id?: string;
  initials: string;
  name: string;
  status: VerificationStatus;
  type: string;
  barangay: string;
  familyMembers: string;
  submitted: string;
  phone: string;
  address: string;
  approvalNote?: {
    approvedBy: string;
    details: string;
  };
  raw?: Record<string, unknown>;
}

export interface ApplicationFormValues {
  surname: string;
  firstName: string;
  middleName: string;
  contactNumber: string;
  ageSex: string;
  occupation: string;
  completeAddress: string;
  barangay: string;
  totalFamilyMembers: string;
  householdHead: string;
  specialNeeds: string;
  medicalConditions: string;
}
