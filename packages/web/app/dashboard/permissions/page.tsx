import { getPermissions } from "@/lib/dashboard/get-permissions";
import { PermissionsForm } from "../_components/permissions-form";

export default async function PermissionsPage() {
  const { permissionConfig, isCustom } = await getPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Control what GBAM can do without asking you first.
          {!isCustom && " You're currently on the default ruleset."}
        </p>
      </div>
      <PermissionsForm initialRules={permissionConfig} />
    </div>
  );
}