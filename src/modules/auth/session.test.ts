import {
  authenticateAdminCredentials,
  createChallengeForAdmin,
  logoutAdminSession,
  getAdminSessionInventoryFromApi,
  isAdminChallengeExpired,
  parseAdminSession,
  revokeAdminSession,
  rotateAdminSession,
  serializeAdminSession,
  verifyAdminMfaCode,
} from "@/modules/auth/session";

const loginResponse = {
  data: {
    status: "authenticated",
    user: {
      id: "9",
      name: "Finance Admin",
      email: "finance@travelmate.test",
      role: "finance",
      team: "Finance",
      requiresMfa: true,
    },
    session: {
      id: 9,
      fingerprint: "en-US::Playwright",
      createdAt: "2026-04-22T10:00:00.000Z",
      lastSeenAt: "2026-04-22T10:00:00.000Z",
      isCurrent: true,
    },
  },
};

const inventoryResponse = {
  data: {
    user: {
      id: "9",
      name: "Finance Admin",
      email: "finance@travelmate.test",
      role: "finance",
      team: "Finance",
      requiresMfa: true,
    },
    currentSessionId: 9,
    sessions: [
      {
        id: 9,
        fingerprint: "en-US::Playwright",
        createdAt: "2026-04-22T10:00:00.000Z",
        lastSeenAt: "2026-04-22T10:05:00.000Z",
        isCurrent: true,
      },
      {
        id: 12,
        fingerprint: "en-GB::Firefox",
        createdAt: "2026-04-22T09:00:00.000Z",
        lastSeenAt: "2026-04-22T09:05:00.000Z",
        isCurrent: false,
      },
    ],
  },
};

const storedSession = {
  user: {
    id: "9",
    name: "Finance Admin",
    email: "finance@travelmate.test",
    role: "finance" as const,
    team: "Finance",
    requiresMfa: true,
  },
  sessionId: "9",
  currentSessionId: 9,
  issuedAt: "2026-04-22T10:00:00.000Z",
  lastValidatedAt: "2026-04-22T10:00:00.000Z",
  deviceLabel: "en-US::Playwright",
  mfaSatisfied: true,
  backendSessionKey: "session-key-123",
};

const mfaRequiredResponse = {
  data: {
    status: "mfa_required",
    user: {
      id: "5",
      name: "Reviewer Admin",
      email: "reviewer@travelmate.test",
      role: "reviewer",
      team: "Review",
      requiresMfa: true,
    },
    challenge: {
      id: 33,
      expiresAt: "2026-04-22T10:10:00.000Z",
    },
  },
};

describe("admin auth session helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps authenticated API login responses into signed dashboard sessions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(loginResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "set-cookie": "tm_partner_api_session=session-key-123; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      ),
    );

    const result = await authenticateAdminCredentials("finance@travelmate.test", "TravelMate!2026");
    if (result.status === "authenticated") {
      expect(result.user.role).toBe("finance");
      expect(result.session.currentSessionId).toBe(9);
      expect(result.session.deviceLabel).toContain("Playwright");
      expect(result.session.mfaSatisfied).toBe(true);
    }
    expect(result.status).toBe("authenticated");
  });

  it("serializes and parses signed session cookies without losing role information", async () => {
    const session = {
      user: {
        id: "1",
        name: "Super Admin",
        email: "superadmin@travelmate.test",
        role: "super_admin" as const,
        team: "Platform",
        requiresMfa: true,
      },
      sessionId: "55",
      currentSessionId: 55,
      issuedAt: "2026-04-22T11:00:00.000Z",
      lastValidatedAt: "2026-04-22T11:05:00.000Z",
      deviceLabel: "en-US::Desktop Chrome",
      mfaSatisfied: true,
      backendSessionKey: "session-key-55",
    };
    const serialized = await serializeAdminSession(session);
    const parsed = await parseAdminSession(serialized);

    expect(parsed?.user.email).toBe("superadmin@travelmate.test");
    expect(parsed?.user.role).toBe("super_admin");
    expect(parsed?.backendSessionKey).toBe("session-key-55");
  });

  it("rejects tampered signed session cookies", async () => {
    const session = {
      user: {
        id: "9",
        name: "Finance Admin",
        email: "finance@travelmate.test",
        role: "finance" as const,
        team: "Finance",
        requiresMfa: true,
      },
      sessionId: "9",
      currentSessionId: 9,
      issuedAt: "2026-04-22T10:00:00.000Z",
      lastValidatedAt: "2026-04-22T10:00:00.000Z",
      deviceLabel: "en-US::Playwright",
      mfaSatisfied: true,
      backendSessionKey: "session-key-123",
    };
    const serialized = await serializeAdminSession(session);
    const tampered = `${serialized.slice(0, -1)}${serialized.slice(-1) === "a" ? "b" : "a"}`;

    await expect(parseAdminSession(tampered)).resolves.toBeNull();
  });

  it("recognizes MFA-required login responses from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mfaRequiredResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await authenticateAdminCredentials("reviewer@travelmate.test", "TravelMate!2026");
    expect(result.status).toBe("mfa_required");
    if (result.status === "mfa_required") {
      expect(result.user.role).toBe("reviewer");
      expect(result.challenge.challengeId).toBe(33);
      expect(result.challenge.expiresAt).toBe("2026-04-22T10:10:00.000Z");
    }
  });

  it("verifies an API MFA response and creates an authenticated session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(loginResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "set-cookie": "tm_partner_api_session=session-key-123; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      ),
    );

    const result = await verifyAdminMfaCode("reviewer@travelmate.test", "123456");
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.session.user.role).toBe("finance");
      expect(result.session.mfaSatisfied).toBe(true);
    }
  });

  it("flags expired admin challenge cookies using backend expiry metadata", () => {
    const expiredChallenge = createChallengeForAdmin(
      "reviewer@travelmate.test",
      "/",
      "2026-04-22T09:00:00.000Z",
      33,
    );
    const activeChallenge = createChallengeForAdmin(
      "reviewer@travelmate.test",
      "/",
      "2099-04-22T10:10:00.000Z",
      34,
    );

    expect(isAdminChallengeExpired(expiredChallenge)).toBe(true);
    expect(isAdminChallengeExpired(activeChallenge)).toBe(false);
  });

  it("loads API-backed admin session inventory for the stored session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(inventoryResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const inventory = await getAdminSessionInventoryFromApi(storedSession);
    expect(inventory?.sessions).toHaveLength(2);
    expect(inventory?.storedSession.currentSessionId).toBe(9);
  });

  it("rotates the current admin session and reads the new backend session key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(inventoryResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "set-cookie": "tm_partner_api_session=session-key-rotated; Path=/; HttpOnly; SameSite=Lax",
          },
        }),
      ),
    );

    const inventory = await rotateAdminSession(storedSession);
    expect(inventory?.storedSession.backendSessionKey).toBe("session-key-rotated");
    expect(inventory?.storedSession.currentSessionId).toBe(9);
  });

  it("revokes a tracked admin session and returns the updated inventory", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              ...inventoryResponse.data,
              sessions: [inventoryResponse.data.sessions[0]],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const inventory = await revokeAdminSession(storedSession, 12);
    expect(inventory?.sessions).toHaveLength(1);
    expect(inventory?.sessions[0].id).toBe(9);
  });

  it("logs out the admin session through the backend endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(logoutAdminSession(storedSession)).resolves.toBe(true);
  });
});
