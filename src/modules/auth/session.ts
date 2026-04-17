import { cookies } from "next/headers";

import { sanitizeNextPath } from "@/modules/auth/access";
import { findMockAdminByEmail } from "@/modules/auth/mock-admins";
import type { AdminChallenge, AdminSession, AdminUser, MockAdminRecord } from "@/modules/auth/types";

export const ADMIN_SESSION_COOKIE = "tm_admin_session";
export const ADMIN_CHALLENGE_COOKIE = "tm_admin_challenge";
const DEV_SESSION_SECRET = "travelmate-admin-dashboard-dev-session-secret";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

function createAdminUser(record: MockAdminRecord): AdminUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    team: record.team,
    requiresMfa: record.requiresMfa,
  };
}

export function createAdminSession(record: MockAdminRecord): AdminSession {
  const now = new Date().toISOString();

  return {
    user: createAdminUser(record),
    sessionId: `${record.id}-${crypto.randomUUID()}`,
    issuedAt: now,
    lastValidatedAt: now,
    deviceLabel: record.trustedDeviceLabel,
    mfaSatisfied: record.requiresMfa,
  };
}

export function refreshAdminSession(session: AdminSession): AdminSession {
  return {
    ...session,
    sessionId: `${session.user.id}-${crypto.randomUUID()}`,
    lastValidatedAt: new Date().toISOString(),
  };
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

export async function serializeAdminSession(session: AdminSession) {
  return serializeSignedPayload(session);
}

export async function parseAdminSession(value?: string | null) {
  return parseSignedPayload<AdminSession>(value);
}

export async function serializeAdminChallenge(challenge: AdminChallenge) {
  return serializeSignedPayload(challenge);
}

export async function parseAdminChallenge(value?: string | null) {
  return parseSignedPayload<AdminChallenge>(value);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return await parseAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function getAdminChallenge() {
  const cookieStore = await cookies();
  return await parseAdminChallenge(cookieStore.get(ADMIN_CHALLENGE_COOKIE)?.value);
}

export async function setAdminSessionCookie(session: AdminSession) {
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

export function authenticateAdminCredentials(email: string, password: string) {
  const record = findMockAdminByEmail(email);

  if (!record || record.password !== password) {
    return { status: "invalid" as const };
  }

  if (record.requiresMfa) {
    return { status: "mfa_required" as const, admin: record };
  }

  return { status: "authenticated" as const, admin: record, session: createAdminSession(record) };
}

export function verifyAdminMfaCode(email: string, code: string) {
  const record = findMockAdminByEmail(email);

  if (!record || !record.requiresMfa || record.mfaCode !== code.trim()) {
    return { status: "invalid" as const };
  }

  return { status: "authenticated" as const, admin: record, session: createAdminSession(record) };
}

export function createChallengeForAdmin(email: string, nextPath?: string | null): AdminChallenge {
  return {
    email,
    nextPath: sanitizeNextPath(nextPath),
    createdAt: new Date().toISOString(),
  };
}
