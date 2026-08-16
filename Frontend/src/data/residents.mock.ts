import type { Resident } from "@/types/residents";

export const residentsMock: Resident[] = [
  { id: "RES-1", name: "Maria Santos", age: 52, sex: "Female", address: "Blk 9000", barangay: "Tanyong", contact: "0912-345-6789" },
  { id: "RES-2", name: "Juan Dela Cruz", age: 30, sex: "Male", address: "Sa tulay", barangay: "Catmon", contact: "0923-456-7890" },
  { id: "RES-3", name: "Rosa Reyes", age: 36, sex: "Prefer not to say", address: "Sa palenke", barangay: "Potrero", contact: "0934-567-8901", selected: true },
];
