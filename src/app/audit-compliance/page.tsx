import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getAccessPolicyEntries, getAuditLogEntries, getRetentionConfig } from "@/modules/audit-compliance/data";
import { AuditComplianceWorkspace } from "@/modules/audit-compliance/workspace";

export default async function AuditCompliancePage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/audit-compliance", session);

  return (
    <AdminShell
      title="Audit & Compliance"
      description="Explore critical action traces, review high-risk events, export compliance evidence, and inspect retention and access policy controls."
    >
      <AuditComplianceWorkspace
        accessPolicyEntries={getAccessPolicyEntries()}
        actor={session.user.name}
        initialEntries={getAuditLogEntries()}
        retentionConfig={getRetentionConfig()}
        role={session.user.role}
      />
    </AdminShell>
  );
}
