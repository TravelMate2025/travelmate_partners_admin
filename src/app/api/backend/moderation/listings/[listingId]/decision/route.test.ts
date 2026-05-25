import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { POST } from "./route";

vi.mock("@/modules/auth/session", () => ({
  ADMIN_API_SESSION_COOKIE: "tm_partner_api_session",
  getAdminApiBaseUrl: vi.fn(() => "http://127.0.0.1:8000/api/v1"),
  getStoredAdminSession: vi.fn(async () => ({ backendSessionKey: "backend-session-key" })),
}));

describe("moderation decision route CSRF forwarding", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards session cookie + csrf cookie + csrf header to upstream decision POST", async () => {
    const fetchMock = vi
      .fn()
      // CSRF probe request
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { results: [] } }), {
          status: 200,
          headers: {
            "X-CSRFToken": "csrf-from-header",
          },
        }),
      )
      // Moderation decision POST
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const request = {
      text: async () => JSON.stringify({ action: "approve", listingKind: "stay" }),
    } as unknown as Request;

    const response = await POST(request as never, {
      params: Promise.resolve({ listingId: "listing-123" }),
    });

    expect(response.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const postCall = fetchMock.mock.calls[1];
    const postInit = postCall[1] as RequestInit;
    const headers = postInit.headers as Record<string, string>;

    expect(headers["X-CSRFToken"]).toBe("csrf-from-header");
    expect(headers.Cookie).toContain("tm_partner_api_session=backend-session-key");
    expect(headers.Cookie).toContain("csrftoken=csrf-from-header");
  });
});
