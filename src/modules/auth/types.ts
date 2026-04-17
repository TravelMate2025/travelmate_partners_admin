export type AdminRole = "super_admin" | "operations" | "reviewer" | "support" | "finance";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  team: string;
  requiresMfa: boolean;
};

export type AdminSession = {
  user: AdminUser;
  sessionId: string;
  issuedAt: string;
  lastValidatedAt: string;
  deviceLabel: string;
  mfaSatisfied: boolean;
};

export type AdminChallenge = {
  email: string;
  nextPath: string;
  createdAt: string;
};

export type MockAdminRecord = AdminUser & {
  password: string;
  mfaCode: string;
  trustedDeviceLabel: string;
};
