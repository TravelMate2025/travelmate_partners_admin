import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getAccessPolicyEntries, getAuditLogEntries, getRetentionConfig } from "@/modules/audit-compliance/data";
import { auditComplianceAllowedRoles } from "@/modules/audit-compliance/rules";
import { AuditComplianceWorkspace } from "@/modules/audit-compliance/workspace";

export default async function AuditCompliancePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/audit-compliance");
  }

  if (!auditComplianceAllowedRoles.includes(session.user.role)) {
    redirect("/auth/access-denied?next=/audit-compliance");
  }

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
