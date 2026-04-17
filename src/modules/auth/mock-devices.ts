import type { AdminUser } from "@/modules/auth/types";

export function getMockTrustedDevices(user: AdminUser) {
  return [
    {
      id: `${user.id}-current`,
      label: "Current trusted session",
      device: user.requiresMfa ? "Verified desktop session" : "Verified support session",
      location: "Lagos, Nigeria",
      status: "Active now",
    },
    {
      id: `${user.id}-backup`,
      label: "Backup device",
      device: `${user.team} fallback laptop`,
      location: "Remote office",
      status: user.requiresMfa ? "MFA ready" : "Password-only fallback",
    },
  ];
}
