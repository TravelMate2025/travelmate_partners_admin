"use server";

import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/modules/auth/access";
import {
  authenticateAdminCredentials,
  clearAdminChallengeCookie,
  clearAdminSessionCookie,
  createChallengeForAdmin,
  getAdminSession,
  getAdminChallenge,
  refreshAdminSession,
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

  const result = authenticateAdminCredentials(email, password);

  if (result.status === "invalid") {
    const params = new URLSearchParams({ error: "invalid_credentials", next: nextPath });
    if (email) {
      params.set("email", email);
    }
    redirect(loginUrl(params));
  }

  if (result.status === "mfa_required") {
    await setAdminChallengeCookie(createChallengeForAdmin(result.admin.email, nextPath));

    const params = new URLSearchParams({
      step: "mfa",
      email: result.admin.email,
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

  if (!challenge || !email) {
    const params = new URLSearchParams({ error: "mfa_expired", next: nextPath });
    redirect(loginUrl(params));
  }

  const result = verifyAdminMfaCode(email, code);

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
  const params = new URLSearchParams({ sent: "1" });

  if (email) {
    params.set("email", email);
  }

  redirect(`/auth/reset-password?${params.toString()}`);
}

export async function signOutAction() {
  await clearAdminSessionCookie();
  await clearAdminChallengeCookie();
  redirect("/auth/login?signed_out=1");
}

export async function refreshSessionAction() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth/login");
  }

  await setAdminSessionCookie(refreshAdminSession(session));
  redirect("/auth/sessions?refreshed=1");
}
