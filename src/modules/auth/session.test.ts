import { findMockAdminByEmail } from "@/modules/auth/mock-admins";
import {
  authenticateAdminCredentials,
  createAdminSession,
  parseAdminSession,
  refreshAdminSession,
  serializeAdminSession,
  verifyAdminMfaCode,
} from "@/modules/auth/session";

describe("admin auth session helpers", () => {
  it("requires MFA for roles configured with MFA enforcement", () => {
    expect(authenticateAdminCredentials("finance@travelmate.test", "TravelMate!2026").status).toBe("mfa_required");
  });

  it("creates a direct session for seeded accounts without MFA enforcement", () => {
    const result = authenticateAdminCredentials("support@travelmate.test", "TravelMate!2026");
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.session.user.role).toBe("support");
    }
  });

  it("serializes and parses signed session cookies without losing role information", async () => {
    const admin = findMockAdminByEmail("superadmin@travelmate.test");
    expect(admin).not.toBeNull();

    const session = createAdminSession(admin!);
    const serialized = await serializeAdminSession(session);
    const parsed = await parseAdminSession(serialized);

    expect(parsed?.user.email).toBe("superadmin@travelmate.test");
    expect(parsed?.user.role).toBe("super_admin");
  });

  it("rejects tampered signed session cookies", async () => {
    const admin = findMockAdminByEmail("finance@travelmate.test");
    expect(admin).not.toBeNull();

    const session = createAdminSession(admin!);
    const serialized = await serializeAdminSession(session);
    const tampered = `${serialized.slice(0, -1)}${serialized.slice(-1) === "a" ? "b" : "a"}`;

    await expect(parseAdminSession(tampered)).resolves.toBeNull();
  });

  it("verifies the seeded MFA code and creates an authenticated session", () => {
    const result = verifyAdminMfaCode("reviewer@travelmate.test", "333333");
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.session.user.role).toBe("reviewer");
      expect(result.session.mfaSatisfied).toBe(true);
    }
  });

  it("rotates the session identifier when a trusted session is refreshed", () => {
    const admin = findMockAdminByEmail("ops@travelmate.test");
    expect(admin).not.toBeNull();

    const session = createAdminSession(admin!);
    const rotated = refreshAdminSession(session);

    expect(rotated.sessionId).not.toBe(session.sessionId);
    expect(rotated.user.email).toBe(session.user.email);
  });
});
