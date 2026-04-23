"use server";

import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/modules/auth/access";
import {
  authenticateAdminCredentials,
  clearAdminChallengeCookie,
  clearAdminSessionCookie,
  createChallengeForAdmin,
  getAdminSessionInventoryFromApi,
  logoutAdminSession,
  getStoredAdminSession,
  getAdminChallenge,
  isAdminChallengeExpired,
  requestAdminPasswordReset,
  resetAdminPassword,
  revokeAdminSession,
  rotateAdminSession,
  setAdminChallengeCookie,
  setAdminSessionCookie,
  verifyAdminMfaCode,
} from "@/modules/auth/session";

function loginUrl(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/auth/login?${query}` : "/auth/login";
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeNextPath(String(formData.get("next") ?? "/"));

  const result = await authenticateAdminCredentials(email, password);

  if (result.status === "invalid") {
    const params = new URLSearchParams({ error: "invalid_credentials", next: nextPath });
    if (email) {
      params.set("email", email);
    }
    redirect(loginUrl(params));
  }

  if (result.status === "mfa_required") {
    await setAdminChallengeCookie(
      createChallengeForAdmin(
        result.user.email,
        nextPath,
        result.challenge.expiresAt,
        result.challenge.challengeId,
      ),
    );

    const params = new URLSearchParams({
      step: "mfa",
      email: result.user.email,
      next: nextPath,
    });

    redirect(loginUrl(params));
  }

  await setAdminSessionCookie(result.session);
  await clearAdminChallengeCookie();
  redirect(nextPath);
}

export async function verifyMfaAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const fallbackEmail = String(formData.get("email") ?? "").trim();
  const fallbackNext = sanitizeNextPath(String(formData.get("next") ?? "/"));
  const challenge = await getAdminChallenge();
  const email = challenge?.email ?? fallbackEmail;
  const nextPath = sanitizeNextPath(challenge?.nextPath ?? fallbackNext);

  if (!challenge || !email || isAdminChallengeExpired(challenge)) {
    await clearAdminChallengeCookie();
    const params = new URLSearchParams({ error: "mfa_expired", next: nextPath });
    redirect(loginUrl(params));
  }

  const result = await verifyAdminMfaCode(email, code);

  if (result.status === "invalid") {
    const params = new URLSearchParams({
      step: "mfa",
      error: "invalid_mfa",
      email,
      next: nextPath,
    });
    redirect(loginUrl(params));
  }

  await setAdminSessionCookie(result.session);
  await clearAdminChallengeCookie();
  redirect(nextPath);
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  await requestAdminPasswordReset(email);
  const params = new URLSearchParams({ step: "verify", sent: "1" });
  if (email) {
    params.set("email", email);
  }
  redirect(`/auth/reset-password?${params.toString()}`);
}

export async function resetAdminPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");

  const result = await resetAdminPassword(email, code, newPassword);

  if (!result.ok) {
    const params = new URLSearchParams({ step: "verify", email, error: result.message });
    redirect(`/auth/reset-password?${params.toString()}`);
  }

  redirect("/auth/login?password_reset=1");
}

export async function signOutAction() {
  const session = await getStoredAdminSession();
  if (session) {
    await logoutAdminSession(session);
  }
  await clearAdminSessionCookie();
  await clearAdminChallengeCookie();
  redirect("/auth/login?signed_out=1");
}

export async function refreshSessionAction() {
  const session = await getStoredAdminSession();

  if (!session) {
    redirect("/auth/login");
  }

  const inventory = await rotateAdminSession(session);
  if (!inventory) {
    await clearAdminSessionCookie();
    redirect("/auth/login?error=session_expired");
  }

  await setAdminSessionCookie(inventory.storedSession);
  redirect("/auth/sessions?rotated=1");
}

export async function revokeAdminSessionAction(formData: FormData) {
  const session = await getStoredAdminSession();
  const sessionId = Number.parseInt(String(formData.get("session_id") ?? ""), 10);

  if (!session || Number.isNaN(sessionId)) {
    redirect("/auth/login");
  }

  const inventory = await revokeAdminSession(session, sessionId);
  if (!inventory) {
    await clearAdminSessionCookie();
    redirect("/auth/login?error=session_expired");
  }

  await setAdminSessionCookie(inventory.storedSession);
  redirect(`/auth/sessions?revoked=${sessionId}`);
}
