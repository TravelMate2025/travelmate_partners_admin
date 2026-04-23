import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getCatalogIssueRecords, getTaxonomyRuleRecords } from "@/modules/catalog-controls/data";
import { CatalogControlsWorkspace } from "@/modules/catalog-controls/workspace";

export default async function CatalogControlsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/catalog-controls", session);

  return (
    <AdminShell
      title="Catalog Controls"
      description="Resolve duplicate listings, standardize taxonomy, validate geo-data, and enforce platform content policy."
    >
      <CatalogControlsWorkspace
        actor={session.user.name}
        initialRecords={getCatalogIssueRecords()}
        initialRules={getTaxonomyRuleRecords()}
        role={session.user.role}
      />
    </AdminShell>
  );
}
