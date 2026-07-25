import { getPermissions } from "@/lib/dashboard/get-permissions";
import { PermissionsForm } from "../_components/permissions-form";
import { auth } from "@clerk/nextjs/server";
import { Lock } from "lucide-react";

export default async function PermissionsPage() {
  // 1. Await the auth() promise
  const { userId } = await auth(); 

  if (!userId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border border-border/60 bg-muted/10 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
          <Lock className="size-5 text-red-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You need to be logged in to view and configure your permissions.
          </p>
        </div>
      </div>
    ); 
  }

  const { permissionConfig, isCustom } = await getPermissions(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Control what GBAM can do without asking you first.
          {!isCustom && " You're currently on the default ruleset."}
        </p>
      </div>
      {/* 4. Pass the missing isCustom prop to the form */}
      <PermissionsForm initialRules={permissionConfig} isCustom={isCustom} />
    </div>
  );
}