import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function SystemConfigPage() {
  return (
    <AdminShell
      title="System Config"
      description="Scaffolded route for platform configuration, taxonomies, templates, and master data."
    >
      <SectionPlaceholder
        description="This route will manage countries, cities, service regions, moderation templates, feature toggles, and static content."
        primaryAction="Review system config"
        stage="Route scaffolded"
        supportingNote="System configuration becomes the upstream source for multiple partner and admin flows, so it needs a stable shell and clear publish model."
        title="Configuration scaffold"
      />
    </AdminShell>
  );
}
