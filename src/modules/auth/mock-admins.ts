import type { MockAdminRecord } from "@/modules/auth/types";

export const mockAdminRecords: MockAdminRecord[] = [
  {
    id: "adm-001",
    name: "Amina Bello",
    email: "superadmin@travelmate.test",
    role: "super_admin",
    team: "Platform Leadership",
    requiresMfa: true,
    password: "TravelMate!2026",
    mfaCode: "111111",
    trustedDeviceLabel: "MacBook Pro · Lagos HQ",
  },
  {
    id: "adm-002",
    name: "David Cole",
    email: "ops@travelmate.test",
    role: "operations",
    team: "Operations",
    requiresMfa: true,
    password: "TravelMate!2026",
    mfaCode: "222222",
    trustedDeviceLabel: "Operations Console · London Desk",
  },
  {
    id: "adm-003",
    name: "Ifeoma Okoye",
    email: "reviewer@travelmate.test",
    role: "reviewer",
    team: "Verification Review",
    requiresMfa: true,
    password: "TravelMate!2026",
    mfaCode: "333333",
    trustedDeviceLabel: "Secure Review Terminal · Abuja",
  },
  {
    id: "adm-004",
    name: "Maya Singh",
    email: "support@travelmate.test",
    role: "support",
    team: "Partner Support",
    requiresMfa: true,
    password: "TravelMate!2026",
    mfaCode: "444444",
    trustedDeviceLabel: "Support Laptop · Remote",
  },
  {
    id: "adm-005",
    name: "Tunde Adebayo",
    email: "finance@travelmate.test",
    role: "finance",
    team: "Finance Operations",
    requiresMfa: true,
    password: "TravelMate!2026",
    mfaCode: "555555",
    trustedDeviceLabel: "Finance Workstation · Lagos HQ",
  },
];

export function findMockAdminByEmail(email: string) {
  return mockAdminRecords.find((admin) => admin.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}
