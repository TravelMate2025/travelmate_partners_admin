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
  currentSessionId: number | null;
  issuedAt: string;
  lastValidatedAt: string;
  deviceLabel: string;
  mfaSatisfied: boolean;
};

export type AdminChallenge = {
  challengeId: number | null;
  email: string;
  nextPath: string;
  createdAt: string;
  expiresAt: string | null;
  backendSessionKey: string | null;
};

export type AdminSessionRecord = {
  id: number;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export type MockAdminRecord = AdminUser & {
  password: string;
  mfaCode: string;
  trustedDeviceLabel: string;
};
