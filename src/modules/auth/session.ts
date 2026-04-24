import { cookies } from "next/headers";

import { sanitizeNextPath } from "@/modules/auth/access";
import type { AdminChallenge, AdminRole, AdminSession, AdminSessionRecord, AdminUser } from "@/modules/auth/types";

export function getAdminApiBaseUrl() {
  return process.env.ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
}

export const ADMIN_SESSION_COOKIE = "tm_admin_session";
export const ADMIN_CHALLENGE_COOKIE = "tm_admin_challenge";
export const ADMIN_API_SESSION_COOKIE = "tm_partner_api_session";
const DEV_SESSION_SECRET = "travelmate-admin-dashboard-dev-session-secret";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type StoredAdminSession = AdminSession & {
  backendSessionKey: string;
};

type AdminApiUserPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  requiresMfa: boolean;
};

type AdminApiSessionPayload = {
  id: number;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

type AdminApiSessionsResponse = {
  data: {
    user: AdminApiUserPayload;
    currentSessionId: number | null;
    sessions: AdminApiSessionPayload[];
  };
};

type AdminLoginApiBody = {
  data: {
    status: "authenticated" | "mfa_required";
    user: AdminApiUserPayload;
    session?: AdminApiSessionPayload;
    challenge?: {
      id: number;
      expiresAt: string;
    };
  };
};

function mapAdminRole(role: string): AdminRole {
  return role as AdminRole;
}

function isFutureIsoTimestamp(value?: string | null) {
  if (!value) {
    return false;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp > Date.now();
}

function mapAdminUser(raw: AdminApiUserPayload): AdminUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: mapAdminRole(raw.role),
    team: raw.team,
    requiresMfa: raw.requiresMfa,
  };
}

function mapAdminSessionRecord(raw: AdminApiSessionPayload): AdminSessionRecord {
  return {
    id: raw.id,
    fingerprint: raw.fingerprint,
    createdAt: raw.createdAt,
    lastSeenAt: raw.lastSeenAt,
    isCurrent: raw.isCurrent,
  };
}

function buildDeviceLabel(currentSession: AdminSessionRecord | null) {
  return currentSession?.fingerprint || "Admin dashboard session";
}

function buildStoredAdminSession({
  user,
  currentSession,
  currentSessionId,
  backendSessionKey,
}: {
  user: AdminUser;
  currentSession: AdminSessionRecord | null;
  currentSessionId: number | null;
  backendSessionKey: string;
}): StoredAdminSession {
  return {
    user,
    sessionId: currentSession ? String(currentSession.id) : `${user.id}-bootstrap`,
    currentSessionId,
    issuedAt: currentSession?.createdAt ?? new Date().toISOString(),
    lastValidatedAt: currentSession?.lastSeenAt ?? new Date().toISOString(),
    deviceLabel: buildDeviceLabel(currentSession),
    mfaSatisfied: true,
    backendSessionKey,
  };
}

function toPublicAdminSession(session: StoredAdminSession): AdminSession {
  return {
    user: session.user,
    sessionId: session.sessionId,
    currentSessionId: session.currentSessionId,
    issuedAt: session.issuedAt,
    lastValidatedAt: session.lastValidatedAt,
    deviceLabel: session.deviceLabel,
    mfaSatisfied: session.mfaSatisfied,
  };
}

function getCurrentSession(sessions: AdminSessionRecord[], currentSessionId: number | null) {
  return sessions.find((session) => session.id === currentSessionId) ?? sessions.find((session) => session.isCurrent) ?? null;
}

function readApiSessionKeyFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(new RegExp(`${ADMIN_API_SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

function readApiSessionKeyFromResponse(response: Response) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    for (const header of getSetCookie.call(response.headers)) {
      const sessionKey = readApiSessionKeyFromCookieHeader(header);
      if (sessionKey) {
        return sessionKey;
      }
    }
  }

  return readApiSessionKeyFromCookieHeader(response.headers.get("set-cookie"));
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? DEV_SESSION_SECRET;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodePayload(value: object) {
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodePayload<T>(value: string): T | null {
  try {
    return JSON.parse(textDecoder.decode(base64UrlToBytes(value))) as T;
  } catch {
    return null;
  }
}

async function createSigningKey() {
  return crypto.subtle.importKey("raw", textEncoder.encode(getSessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function signPayload(encodedPayload: string) {
  const signingKey = await createSigningKey();
  const signature = await crypto.subtle.sign("HMAC", signingKey, textEncoder.encode(encodedPayload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayloadSignature(encodedPayload: string, signature: string) {
  try {
    const signingKey = await createSigningKey();
    return await crypto.subtle.verify("HMAC", signingKey, base64UrlToBytes(signature), textEncoder.encode(encodedPayload));
  } catch {
    return false;
  }
}

async function serializeSignedPayload(payload: object) {
  const encodedPayload = encodePayload(payload);
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function parseSignedPayload<T>(value?: string | null) {
  if (!value || !value.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
  const signatureValid = await verifyPayloadSignature(encodedPayload, signature);

  if (!signatureValid) {
    return null;
  }

  return decodePayload<T>(encodedPayload);
}

export async function serializeAdminSession(session: StoredAdminSession) {
  return serializeSignedPayload(session);
}

export async function parseAdminSession(value?: string | null) {
  return parseSignedPayload<StoredAdminSession>(value);
}

export async function serializeAdminChallenge(challenge: AdminChallenge) {
  return serializeSignedPayload(challenge);
}

export async function parseAdminChallenge(value?: string | null) {
  return parseSignedPayload<AdminChallenge>(value);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = await parseAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) {
    return null;
  }

  const inventory = await getAdminSessionInventoryFromApi(session);
  return inventory ? toPublicAdminSession(inventory.storedSession) : null;
}

export async function getStoredAdminSession() {
  const cookieStore = await cookies();
  return await parseAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function getAdminChallenge() {
  const cookieStore = await cookies();
  return await parseAdminChallenge(cookieStore.get(ADMIN_CHALLENGE_COOKIE)?.value);
}

export async function setAdminSessionCookie(session: StoredAdminSession) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, await serializeAdminSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function setAdminChallengeCookie(challenge: AdminChallenge) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_CHALLENGE_COOKIE, await serializeAdminChallenge(challenge), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function clearAdminChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_CHALLENGE_COOKIE);
}

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function readAdminSessionInventoryFromResponse(response: Response, backendSessionKey: string) {
  const body = await readJson<AdminApiSessionsResponse>(response);
  if (!body) {
    return null;
  }

  const user = mapAdminUser(body.data.user);
  const sessions = body.data.sessions.map(mapAdminSessionRecord);
  const currentSession = getCurrentSession(sessions, body.data.currentSessionId);

  return {
    user,
    currentSessionId: body.data.currentSessionId,
    sessions,
    storedSession: buildStoredAdminSession({
      user,
      currentSession,
      currentSessionId: body.data.currentSessionId,
      backendSessionKey,
    }),
  };
}

export async function authenticateAdminCredentials(email: string, password: string) {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "invalid" as const };
    }

    const body = await readJson<AdminLoginApiBody>(response);
    if (!body) {
      return { status: "invalid" as const };
    }

    const user = mapAdminUser(body.data.user);

    if (body.data.status === "mfa_required") {
      const backendSessionKey = readApiSessionKeyFromResponse(response);
      if (!backendSessionKey) {
        return { status: "invalid" as const };
      }
      return {
        status: "mfa_required" as const,
        user,
        challenge: {
          challengeId: body.data.challenge?.id ?? null,
          expiresAt: body.data.challenge?.expiresAt ?? null,
          backendSessionKey,
        },
      };
    }

    const resolvedBackendSessionKey = readApiSessionKeyFromResponse(response);
    if (!resolvedBackendSessionKey || !body.data.session) {
      return { status: "invalid" as const };
    }

    return {
      status: "authenticated" as const,
      user,
      session: buildStoredAdminSession({
        user,
        currentSession: mapAdminSessionRecord(body.data.session),
        currentSessionId: body.data.session.id,
        backendSessionKey: resolvedBackendSessionKey,
      }),
    };
  } catch {
    return { status: "invalid" as const };
  }
}

export async function verifyAdminMfaCode(email: string, code: string, challengeId: number | null, backendSessionKey: string | null) {
  if (!challengeId || !backendSessionKey) {
    return { status: "invalid" as const };
  }

  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/mfa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${backendSessionKey}`,
      },
      body: JSON.stringify({ email, code, challengeId }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "invalid" as const };
    }

    const body = await readJson<AdminLoginApiBody>(response);
    if (!body) {
      return { status: "invalid" as const };
    }

    const resolvedBackendSessionKey = readApiSessionKeyFromResponse(response) ?? backendSessionKey;
    if (!resolvedBackendSessionKey || !body.data.session) {
      return { status: "invalid" as const };
    }

    const user = mapAdminUser(body.data.user);
    return {
      status: "authenticated" as const,
      user,
      session: buildStoredAdminSession({
        user,
        currentSession: mapAdminSessionRecord(body.data.session),
        currentSessionId: body.data.session.id,
        backendSessionKey: resolvedBackendSessionKey,
      }),
    };
  } catch {
    return { status: "invalid" as const };
  }
}

export function createChallengeForAdmin(
  email: string,
  nextPath?: string | null,
  expiresAt?: string | null,
  challengeId?: number | null,
  backendSessionKey?: string | null,
): AdminChallenge {
  return {
    challengeId: challengeId ?? null,
    email,
    nextPath: sanitizeNextPath(nextPath),
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt ?? null,
    backendSessionKey: backendSessionKey ?? null,
  };
}

export function isAdminChallengeExpired(challenge: AdminChallenge | null) {
  if (!challenge) {
    return true;
  }

  if (!challenge.expiresAt) {
    return false;
  }

  return !isFutureIsoTimestamp(challenge.expiresAt);
}

export async function getAdminSessionInventoryFromApi(session: StoredAdminSession) {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/sessions`, {
      method: "GET",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await readAdminSessionInventoryFromResponse(response, session.backendSessionKey);
  } catch {
    return null;
  }
}

export async function rotateAdminSession(session: StoredAdminSession) {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/sessions/refresh`, {
      method: "POST",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const rotatedSessionKey = readApiSessionKeyFromResponse(response);
    if (!rotatedSessionKey) {
      return null;
    }

    return await readAdminSessionInventoryFromResponse(response, rotatedSessionKey);
  } catch {
    return null;
  }
}

export async function revokeAdminSession(session: StoredAdminSession, sessionId: number) {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await readAdminSessionInventoryFromResponse(response, session.backendSessionKey);
  } catch {
    return null;
  }
}

export async function requestAdminPasswordReset(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function acceptAdminInvitation(
  token: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });

    if (response.ok) {
      return { ok: true };
    }

    const body = await readJson<{ data?: object; message?: string; error?: { message?: string } }>(response);
    return {
      ok: false,
      message: body?.message ?? body?.error?.message ?? "Unable to accept the admin invitation.",
    };
  } catch {
    return {
      ok: false,
      message: "Unable to accept the admin invitation.",
    };
  }
}

export async function resetAdminPassword(email: string, code: string, newPassword: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, new_password: newPassword }),
      cache: "no-store",
    });
    if (response.ok) {
      return { ok: true };
    }
    const body = await readJson<{ message?: string }>(response);
    return { ok: false, message: body?.message ?? "Reset failed." };
  } catch {
    return { ok: false, message: "Reset failed." };
  }
}

export async function logoutAdminSession(session: StoredAdminSession) {
  try {
    const response = await fetch(`${getAdminApiBaseUrl()}/admin-auth/logout`, {
      method: "POST",
      headers: {
        Cookie: `${ADMIN_API_SESSION_COOKIE}=${session.backendSessionKey}`,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}
